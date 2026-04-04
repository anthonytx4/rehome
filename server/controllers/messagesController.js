import { PrismaClient } from '@prisma/client';
import { handleUpload } from '../middleware/upload.js';
import { decorateListingWithArtwork } from '../../src/utils/listingArtwork.js';

const prisma = new PrismaClient();

export const getInbox = async (req, res, next) => {
  try {
    // Get all unique conversations for the current user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
        listing: { select: { id: true, petName: true, breed: true, price: true, images: true, species: true } }
      }
    });

    // Group by conversation (listingId + other user)
    const conversations = {};
    messages.forEach(msg => {
      const otherUser = msg.senderId === req.user.id ? msg.receiver : msg.sender;
      const key = `${msg.listingId}-${otherUser.id}`;
      if (!conversations[key]) {
        conversations[key] = {
          listingId: msg.listingId,
          listing: decorateListingWithArtwork(msg.listing),
          otherUser,
          lastMessage: msg,
          unreadCount: 0
        };
      }
      if (!msg.read && msg.receiverId === req.user.id) {
        conversations[key].unreadCount++;
      }
    });

    res.json(Object.values(conversations));
  } catch (err) {
    next(err);
  }
};

export const getThread = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.query; // the other user in the conversation

    if (!userId) {
      return res.status(400).json({ error: 'userId query param required' });
    }

    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        listingId,
        senderId: userId,
        receiverId: req.user.id,
        read: false
      },
      data: { read: true }
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// Check if a user can message about a listing (queue gate)
async function checkQueueAccess(userId, listingId) {
  const [user, listing, existingThread] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { membershipTier: true, remainingSkips: true } }),
    prisma.listing.findUnique({ where: { id: listingId }, select: { createdAt: true, userId: true, category: true } }),
    prisma.message.findFirst({ where: { listingId, senderId: userId } }),
  ]);

  if (!listing) return { allowed: false, reason: 'Listing not found' };
  // Queue only applies to pets — livestock and supplies can message freely
  if (listing.category !== 'pets') return { allowed: true };
  // Seller can always reply to their own listing threads
  if (listing.userId === userId) return { allowed: true };
  // Already has an active conversation — allow continued messaging
  if (existingThread) return { allowed: true };
  // Premium members bypass the queue
  if (user.membershipTier && user.membershipTier !== 'free') return { allowed: true };

  const hoursSinceListing = (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60);
  // Queue is active for first 24 hours
  if (hoursSinceListing < 24) {
    // Check if user has skip credits
    if (user.remainingSkips > 0) {
      await prisma.user.update({ where: { id: userId }, data: { remainingSkips: { decrement: 1 } } });
      return { allowed: true, skipped: true };
    }
    const hoursLeft = Math.ceil(24 - hoursSinceListing);
    return { allowed: false, reason: 'queue_active', hoursLeft };
  }

  return { allowed: true };
}

export const checkQueue = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const access = await checkQueueAccess(req.user.id, listingId);
    res.json(access);
  } catch (err) { next(err); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, listingId, content } = req.body;
    const mediaFile = req.file;

    if (!receiverId || !listingId) {
      return res.status(400).json({ error: 'receiverId and listingId are required' });
    }

    if (!content && !mediaFile) {
      return res.status(400).json({ error: 'Message content or media is required' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Enforce queue gate on first message
    const access = await checkQueueAccess(req.user.id, listingId);
    if (!access.allowed) {
      return res.status(403).json({ error: 'queue_active', hoursLeft: access.hoursLeft,
        message: `This listing is in review queue. ${access.hoursLeft}h left or pay $9 to skip.` });
    }

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      mediaUrl = await handleUpload(req.file, 'messages');
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    const message = await prisma.message.create({
      data: {
        content: content || '',
        senderId: req.user.id,
        receiverId,
        listingId,
        mediaUrl,
        mediaType
      },
      include: {
        sender: { select: { name: true, avatar: true } }
      }
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

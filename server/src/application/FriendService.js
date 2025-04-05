// TODO: Delete dataRespository after friendRepository is fully implemented
class FriendService {
  constructor(dataRepository, friendRepository, authRepository) {
    this.dataRepository = dataRepository;
    this.friendRepository = friendRepository;
    this.authRepository = authRepository;
  }

  async getFriendsList(userId) {
    try {
      const friends = await this.friendRepository.getFriends();
      const userFriends = friends.find(f => f.user.id.toString() === userId.toString());
      return userFriends ? userFriends.friends : [];
    } catch (error) {
      throw new Error(`Failed to get friends list: ${error.message}`);
    }
  }

  async sendFriendRequest(fromUserId, toUserId) {
    try {
      // Validate users exist
      const fromUser = await this.authRepository.findById(fromUserId);
      const toUser = await this.authRepository.findById(toUserId);
      if (!fromUser || !toUser)
        throw new Error('One or both users not found');

      // Check if a pending request already exists
      const existingRequest = await this.friendRepository.findPendingRequest(fromUserId, toUserId);
      if (existingRequest)
        throw new Error('Friend request already sent');

      // Simplified friendship check using the new areFriends method
      const areFriends = await this.friendRepository.areFriends(fromUserId, toUserId);
      if (areFriends)
        throw new Error('Users are already friends');

      // Create and insert new request
      const newRequest = {
        id: `${fromUserId}-${toUserId}-${Date.now()}`,
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await this.friendRepository.insertFriendRequest(newRequest);
      return newRequest;
    } catch (error) {
      throw new Error(`Failed to send friend request: ${error.message}`);
    }
  }

  async getPendingRequests(userId) {
    try {
      const requests = await this.friendRepository.getFriendRequests();
      return requests.filter(
        r => r.toUserId.toString() === userId.toString() && r.status === 'pending'
      );
    } catch (error) {
      throw new Error(`Failed to get pending requests: ${error.message}`);
    }
  }

  async respondToFriendRequest(requestId, accept) {
    console.log('Responding to friend request in application:');
    try {
      // Find the specific request
      const request = await this.friendRepository.findFriendRequestById(requestId);
      console.log('Request:', request);
      if (!request)
        throw new Error('Friend request not found');
      
      // If accepted, add friendship between users
      if (accept) {
        const fromUser = await this.authRepository.findById(request.fromUserId);
        const toUser = await this.authRepository.findById(request.toUserId);
        if (!fromUser || !toUser)
          throw new Error('One or both users not found');
        
        await this.addFriendship(await this.friendRepository.getFriends(), fromUser, toUser);
      }

      // Update the friend request status
      const updatedRequest = await this.friendRepository.updateFriendRequest(requestId, {
        status: accept ? 'accepted' : 'rejected',
        createdAt: new Date().toISOString()
      });
      return updatedRequest;
    } catch (error) {
      throw new Error(`Failed to respond to friend request: ${error.message}`);
    }
  }

  async addFriendship(friendsList, user1, user2) {
    console.log('Adding friendship in application:');
    console.log('User1:', user1);
    console.log('User2:', user2); 
    console.log('Friends:', friendsList);
    try {
      // Add to user1's friends
      let user1Friends = friendsList.find(f => f.user._id.toString() === user1._id.toString());
      if (!user1Friends) {
        user1Friends = { 
          user: { 
            _id: user1._id, 
            username: user1.username 
          }, 
          friends: [] 
        };
        friendsList.push(user1Friends);
      }
      
      if (!user1Friends.friends.some(f => f._id.toString() === user2._id.toString())) {
        user1Friends.friends.push({
          _id: user2._id,
          username: user2.username,
          email: user2.email
        });
      }

      // Add to user2's friends
      let user2Friends = friendsList.find(f => f.user._id.toString() === user2._id.toString());
      if (!user2Friends) {
        user2Friends = { 
          user: { 
            _id: user2._id, 
            username: user2.username 
          }, 
          friends: [] 
        };
        friendsList.push(user2Friends);
      }
      
      if (!user2Friends.friends.some(f => f._id.toString() === user1._id.toString())) {
        user2Friends.friends.push({
          _id: user1._id,
          username: user1.username,
          email: user1.email
        });
      }

       await this.friendRepository.saveFriends(friendsList);
    } catch (error) {
      throw new Error(`Failed to add friendship: ${error.message}`);
    }
  }
}

module.exports = FriendService;
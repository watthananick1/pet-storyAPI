io.on("connection", (socket) => {
  console.log("Connected....");

  // Handle socket events
  socket.on("newPost", (newPost) => {
    // Emit the new post to all connected clients
    io.emit("newPost", newPost);
  });

  socket.on('newLike', (likeData) => {
    // Broadcast the newLike event to all connected clients except the sender
    socket.broadcast.emit('newLike', likeData);

    // Emit a postUpdate event to notify clients about the updated post
    io.emit('postUpdate', likeData);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Handle other socket events...
});
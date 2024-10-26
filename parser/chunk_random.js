function getRandomChunks(chunkArray, count) {
  const randomChunks = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * chunkArray.length);
    const randomChunk = chunkArray[randomIndex];
    randomChunks.push(randomChunk);
  }

  return randomChunks;
}

function random_chunk(chunk_array) {
  const count = 32;
  return getRandomChunks(chunk_array, count);
}

module.exports = {
  random_chunk,
};

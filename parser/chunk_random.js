function random_chunk(chunk_array) {
  const chunk_len = chunk_array.length;
  const twenty_percent = Math.ceil((chunk_len * 20) / 100);
  const twenty_percent_random_chunks = [];

  for (let i = 0; i < twenty_percent; i++) {
    const randomIndex = Math.floor(Math.random() * chunk_array.length);
    const randomChunk = chunk_array[randomIndex];
    twenty_percent_random_chunks.push(randomChunk);
  }
  return twenty_percent_random_chunks;
}

module.exports = {
  random_chunk,
};

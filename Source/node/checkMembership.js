
var bf = require("bloomfilter"),
    BloomFilter = bf.BloomFilter,
    fnv_1a = bf.fnv_1a,
    fnv_1a_b = bf.fnv_1a_b;

var bloom = new BloomFilter(
  32 * 256, // number of bits to allocate.
  16        // number of hash functions.
);

// Add some elements to the filter.
bloom.add("foo");
bloom.add("bar");

// Test if an item is in our filter.
// Returns true if an item is probably in the set,
// or false if an item is definitely not in the set.
console.log( bloom.test("foo") );
console.log( bloom.test("bar") );
console.log( bloom.test("blah") );
console.log( bloom.test("barbar") );
console.log( bloom.test("bare") );
console.log( bloom.test("bart") );
console.log( bloom.test("bares") );


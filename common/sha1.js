module.exports = sha1;

function sha1(buffer) {
  if (buffer === undefined) return create();
  var shasum = create();
  shasum.update(buffer);
  return shasum.digest();
}

// A streaming interface for when nothing is passed in.
function create() {
  var h0 = 0x67452301;
  var h1 = 0xEFCDAB89;
  var h2 = 0x98BADCFE;
  var h3 = 0x10325476;
  var h4 = 0xC3D2E1F0;
  // The first 64 bytes (16 words) is the data chunk
  var block = new Uint32Array(80), offset = 0, shift = 24;
  var totalLength = 0;

  return { update: update, digest: digest };

  // The user gave us more data.  Store it!
  function update(chunk) {
    if (typeof chunk === "string") return updateString(chunk);
    var length = chunk.length;
    totalLength += length * 8;
    for (var i = 0; i < length; i++) {
      write(chunk[i]);
    }
  }

  function updateString(string) {
    var encoded = unescape(encodeURIComponent(string));
    var length = encoded.length;
    totalLength += length * 8;
    for (var i = 0; i < length; i++) {
      write(encoded.charCodeAt(i));
    }
  }

  function write(byte) {
    block[offset] |= (byte & 0xff) << shift;
    if (shift) {
      shift -= 8;
    }
    else {
      offset++;
      shift = 24;
    }
    if (offset === 16) processBlock();
  }

  // No more data will come, pad the block, process and return the result.
  function digest() {
    // Pad
    write(0x80);
    if (offset > 14 || (offset === 14 && shift < 24)) {
      processBlock();
    }
    offset = 14;
    shift = 24;

    // 64-bit length big-endian
    write(0x00); // numbers this big aren't accurate in javascript anyway
    write(0x00); // ..So just hard-code to zero.
    write(totalLength > 0xffffffffff ? totalLength / 0x10000000000 : 0x00);
    write(totalLength > 0xffffffff ? totalLength / 0x100000000 : 0x00);
    for (var s = 24; s >= 0; s -= 8) {
      write(totalLength >> s);
    }

    // At this point one last processBlock() should trigger and we can pull out the result.
    return toHex(h0)
         + toHex(h1)
         + toHex(h2)
         + toHex(h3)
         + toHex(h4);
  }

  // We have a full block to process.  Let's do it!
  function processBlock() {
    // Extend the sixteen 32-bit words into eighty 32-bit words:
    for (var i = 16; i < 80; i++) {
      var w = block[i - 3] ^ block[i - 8] ^ block[i - 14] ^ block[i - 16];
      block[i] = (w << 1) | (w >>> 31);
    }

    // log(block);

    // Initialize hash value for this chunk:
    var a = h0;
    var b = h1;
    var c = h2;
    var d = h3;
    var e = h4;
    var f, k;

    // Main loop:
    for (i = 0; i < 80; i++) {
      if (i < 20) {
        f = d ^ (b & (c ^ d));
        k = 0x5A827999;
      }
      else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      }
      else if (i < 60) {
        f = (b & c) | (d & (b | c));
        k = 0x8F1BBCDC;
      }
      else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      var temp = (a << 5 | a >>> 27) + f + e + k + block[i];
      e = d;
      d = c;
      c = (b << 30 | b >>> 2);
      b = a;
      a = temp;
    }

    // Add this chunk's hash to result so far:
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;

    // The block is now reusable.
    offset = 0;
    for (i = 0; i < 16; i++) {
      block[i] = 0;
    }
  }

  function toHex(word) {
    var hex = "";
    for (var i = 28; i >= 0; i -= 4) {
      hex += ((word >> i) & 0xf).toString(16);
    }
    return hex;
  }

}

/*
// Uncomment to test in node.js

var assert = require('assert');
var tests = [
  "", "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  "a", "86f7e437faa5a7fce15d1ddcb9eaeaea377667b8",
  "abc", "a9993e364706816aba3e25717850c26c9cd0d89d",
  "message digest", "c12252ceda8be8994d5fa0290a47231c1d16aae3",
  "abcdefghijklmnopqrstuvwxyz", "32d10c7b8cf96570ca04ce37f2a19d84240d3a89",
  "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
    "84983e441c3bd26ebaae4aa1f95129e5e54670f1",
  "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabc",
    "a6319f25020d5ff8722d40ae750dbab67d94fe4f",
  "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZab",
    "edb3a03256d1c6d148034ec4795181931c933f46",
  "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZa",
    "677734f7bf40b2b244cae100bf365598fbf4741d",
]

for (var i = 0; i < tests.length; i += 2) {
  var input = tests[i];
  console.log("\n" + JSON.stringify(input));
  var expectedHex = tests[i + 1];
  console.log(expectedHex);
  var hash = sha1(input);
  console.log(hash);
  if (hash !== expectedHex) {
    throw new Error(hash + " != " + expectedHex + " for '" + input + "'");
  }
  var sha1sum = sha1();
  for (var j = 0, l = input.length; j < l; j += 17) {
    sha1sum.update(input.substr(j, 17));
  }
  hash = sha1sum.digest();
  console.log(hash);
  if (hash !== expectedHex) {
    throw new Error(hash + " != " + expectedHex + " for '" + input + "'");
  }
}

console.log("\n1,000,000 repetitions of the character 'a'");
var expectedHex = "34aa973cd4c4daa4f61eeb2bdbad27316534016f";
console.log(expectedHex);
var sha1sum = sha1();
for (var i = 0; i < 100000; i++) {
  sha1sum.update("aaaaaaaaaa");
}
var hash = sha1sum.digest();
console.log(hash);
if (hash !== expectedHex) {
  throw new Error(hash + " != " + expectedHex + " for '" + input + "'");
}
*/

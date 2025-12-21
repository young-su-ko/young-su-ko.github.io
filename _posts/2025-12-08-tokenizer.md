---
layout: post
category: projects
title: implementing bpe
---

Going through Stanford CS336 to get a more hands-on experience on training language models. The first step is implementing byte-pair encoding (BPE) tokenizer. 

#### tokenization
A tokenizer converts between strings and sequence of integers. There are many possible ways to convert strings into integers, and some have more obvious drawbacks compared to others. One useful metric is the compression ratio, which is the number of bytes / number of tokens.

##### character-based tokenization
We can map each character into some integer, like the Unicode integer[^1]. Currently, there are around ~150K Unicode characters, which can be conisidered a large vocabulary size. Many of the characters are rarely used and individual characters carry low semantic information.

##### byte-based tokenization
Unicode characters can be represented as a series of bytes through UTF-8 encoding. Because each byte is made up of 8 bits, the vocabulary size is only $2^8=256$. However, the compression ratio is 1 and a single Unicode character can become 4 bytes with UTF-8. Given the cost of attention scales with the length of the context, it a major weakness of byte-based tokenization.

##### word-based tokenization
We can split a string into words and map each word to an integer. The vocabulary size is extremely large and the potential of running into new words that are not accounted for during training is large. Many words are also very rare. 

##### byte-pair encoding tokenization
To address some of the issues outlined above, we can use BPE. We *train* a tokenizer to determine the vocabulary, based on some reference corpus. With this setup, commonly used sequences can be represented as one token, while rarer strings will use multiple. This makes it more efficient, capture a lot of information per token, and also handle unseen words.

#### BPE Algorithm
1. Convert tokenizer training text into UTF-8 bytes. These bytes make up the intial 256-sized vocabulary, and the sequence can be represented with these byte tokens.
2. Go through the training text and count the number of occurences for each pair of **adjacent** tokens. 
3. Identify the most frequently occuring adjacent tokens[^2] (let's say tokens 12 and 9), and merge it into a new token. This will increase the vocabulary size by 1. 
4. Replace any instance of the adjacent tokens with the newly added token. (find any time token 12 and 9 are next to each other, merge and replace with token 257)
5. Repeat steps 2-4 until desired vocabulary size and compression ratio is achieved.

##### pre-tokenization


---
{: data-content="footnotes"}
[^1]: A Unicode character has the format U+XXXX, where "XXXX" is a list of hexadecimal characters, representing the integer id of the Unicode character. UTF-8 encodes that integer into either 1, 2, 3, or 4 bytes.
[^2]: What if there are multiple adjacent tokens with the same count? For example, # (e,r) == # (s,t). In these cases we choose the one with the lexographically highest pair, so here (s,t).
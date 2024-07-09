const express = require('express');
const path = require('path');
const natural = require('natural');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let aiKnowledge = {};

async function fetchDefinition(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        if (data && data[0] && data[0].meanings && data[0].meanings[0] && data[0].meanings[0].definitions) {
            return data[0].meanings[0].definitions[0].definition;
        }
    } catch (error) {
        console.error('Error fetching definition:', error);
    }
    return null;
}

async function learnWordRecursively(word, depth = 0, maxDepth = 3) {
    if (depth > maxDepth || aiKnowledge[word]) return;

    const definition = await fetchDefinition(word);
    if (definition) {
        aiKnowledge[word] = definition;
        const tokens = natural.WordTokenizer().tokenize(definition);
        for (const token of tokens) {
            if (token.length > 3) {
                await learnWordRecursively(token.toLowerCase(), depth + 1, maxDepth);
            }
        }
    }
}

async function getPartOfSpeech(text) {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text);
    const lexicon = new natural.Lexicon('EN', 'N');
    const ruleset = new natural.RuleSet('EN');
    const tagger = new natural.BrillPOSTagger(lexicon, ruleset);
    return tagger.tag(tokens);
}

async function generateResponse(message) {
    const taggedMessage = await getPartOfSpeech(message);
    let response = "I understood these words: ";

    for (const [word, tag] of taggedMessage) {
        if (aiKnowledge[word.toLowerCase()]) {
            response += `${word} (${aiKnowledge[word.toLowerCase()]}), `;
        } else {
            await learnWordRecursively(word.toLowerCase());
            if (aiKnowledge[word.toLowerCase()]) {
                response += `${word} (I just learned: ${aiKnowledge[word.toLowerCase()]}), `;
            }
        }
    }

    return response.slice(0, -2) + '.';
}

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    const response = await generateResponse(message);
    res.json({ response });
});

app.post('/train', async (req, res) => {
    const { input } = req.body;
    const words = natural.WordTokenizer().tokenize(input);
    for (const word of words) {
        if (word.length > 3) {
            await learnWordRecursively(word.toLowerCase());
        }
    }
    res.json({ success: true, message: 'AI trained successfully' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

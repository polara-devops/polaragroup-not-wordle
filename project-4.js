'use strict';
// Imports
import { wordleWords } from "./wordle-list.js";
import { fullList } from "./full-list.js";

// Global States
const state = {
    wordleWord: [],
    currentGuess: [],
    currentTile: 1,
    currentTileRow: 1,
    gameEnded: false,
    completed: false
};

// Main
function main() {
    createTiles();
    createKeys();
    chooseWord();
    listenForEvents();
    const firstTile = document.querySelector(`.row[data-row="${state.currentTileRow}"]`).querySelector(`.tile[data-tile="${state.currentTile}"]`);
    firstTile.classList.add('active');
}

// Create Tiles
function createTiles() {
    const container = document.getElementById('tiles');
    for (let i = 1; i < 7; i++) {
        container.innerHTML += `
        <div class="row" data-row="${i}">
        <div class="tile" data-tile="1"></div>
        <div class="tile" data-tile="2"></div>
        <div class="tile" data-tile="3"></div>
        <div class="tile" data-tile="4"></div>
        <div class="tile" data-tile="5"></div>
        </div>
        `;
    }
}

// Create Keys
function createKeys() {
    const container = document.getElementById('keys');
    const qwerty = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        [
            'ENTER',
            'Z',
            'X',
            'C',
            'V',
            'B',
            'N',
            'M',
            `<span class="material-symbols-outlined" data-key="backspace">backspace</span>`,
        ],
    ];
    let html = "";
    for (let keyRow of qwerty) {
        html += `<div class="row">`;
        for (let key of keyRow) {
            if (key === "ENTER") {
                html += `<div class="key enter" data-key="${key}">${key}</div>`;
            }
            else if (key.includes("backspace")) {
                html += `<div class="key" data-key="backspace">${key}</div>`;
            }
            else {
                html += `
                    <div class="key" data-key="${key}">${key}</div>
                `;
            }
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}

// Key/Keyboard Handlers
function keystroke(event) {
    if (state.gameEnded && state.completed && !modalIsOpen()) {
        return notice("Nice, you completed the Wordle!");
    }
    else if (state.gameEnded && !state.completed && !modalIsOpen()) {
        return notice("Sorry, you're out of turns!");
    }
    let key = '';
    if (event instanceof KeyboardEvent) {
        key = event.key.toLowerCase();
    }
    else if (event instanceof PointerEvent) {
        key = event.target.dataset.key.toLowerCase();
    }
    let regex = /^[a-zA-Z]$/;
    switch (key) {
        case 'enter':
            checkGuess();
            break;
        case 'backspace':
            backSpace();
            break;
        case 'escape':
            if (modalIsOpen()) closeModal(); break;
        default:
            if (event instanceof KeyboardEvent) {
                if (/^[a-zA-Z]$/.test(key)) {
                    buildGuess(key);
                    break;
                }
                else {
                    notice("Sorry that key isn't valid");
                    break;
                }
            }
            else if (event instanceof PointerEvent) {
                buildGuess(key);
                break;
            }
        }
}

// Event Listeners
function listenForEvents(event) {
    document.addEventListener('keydown', keystroke);
    const keyElements = document.querySelectorAll('.key');
    for (let key of keyElements) {
        key.addEventListener('click', keystroke);
    }
}

// Functionality
function notice(message) {
    let container = document.getElementById('notice');
    container.innerHTML = `<p>${message}</p>`;
    container.classList.add('open');
        setTimeout(() => {
            container.classList.remove('open');
        }, 1500);
    console.log(message);
}

function chooseWord() {
    const word = wordleWords[Math.floor(Math.random() * wordleWords.length)];
    state.wordleWord = word.split('');
    console.log("Wordle Word: " + state.wordleWord.join(''));
}

function buildGuess(letter) {
    if (state.currentGuess.length < 5) {
        addTile(letter);
    } else {
        const row = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
        const tile = row.querySelector(`.tile[data-tile="5"]`);
        tile.textContent = letter.toUpperCase();
        state.currentGuess[4] = letter;
    }
    state.currentGuess = state.currentGuess.slice(0, 5);
} 

function addTile(letter) {
    let row = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);

    let currentTile = row.querySelector(`.tile[data-tile="${state.currentTile}"]`);
    currentTile.innerHTML = letter.toUpperCase();
    currentTile.classList.remove('active');

    state.currentGuess.push(letter);

    if (state.currentTile != 5) state.currentTile++;
    else state.currentTile = 5;

    row = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
    currentTile = row.querySelector(`.tile[data-tile="${state.currentTile}"]`);
    currentTile.classList.add('active');
}

function backSpace() {
    if (state.currentGuess.length > 0) {
        deleteTile();
    }
}

function deleteTile() {
    let row = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
    let index = state.currentGuess.length;
    
    let tile = row.querySelector(`.tile[data-tile="${index}"]`);
    if (!tile) return;
    tile.innerHTML = '';
    
    row.querySelectorAll('.tile').forEach(t => t.classList.remove('active'));
    tile.classList.add('active');
    state.currentGuess.pop();
    state.currentTile = index;
}

function isValid(word) {
    return fullList.includes(word.join(''));
}

function checkGuess() {
    let currentGuess = state.currentGuess;
    if (currentGuess.length < 5) {
        notice("Not enough letters");
    }
    else {
        let currentRow = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
        if (!isValid(currentGuess)) {
            currentRow.classList.add('shake');
            notice("Not a word");
            setTimeout(() => {
                currentRow.classList.remove('shake');
            }, 1000);
        }
        else {
            evaluateGuess();
            let tiles = currentRow.querySelectorAll('.tile');
            for (let i = 0; i < tiles.length; i++) {
                tiles[i].classList.remove('active');
            } 
        }
    }
}

function evaluateGuess() {

    let guessArray = [...state.currentGuess];
    let wordleArray = [...state.wordleWord];
    let completed = false;
    let resultArray = ['absent', 'absent', 'absent', 'absent', 'absent'];

    let letterCount = {};
    for (let letter of wordleArray) {
        if (letterCount[letter]) {
            letterCount[letter] = letterCount[letter] + 1;
        } else {
            letterCount[letter] = 1;
        }
    }

    for (let i = 0; i < guessArray.length; i++) {
        if (guessArray[i] === wordleArray[i]) {
            resultArray[i] = "correct";
            letterCount[guessArray[i]] = letterCount[guessArray[i]] - 1;
        }
    }

    for (let i = 0; i < guessArray.length; i++) {
        let letter = guessArray[i];
        if (
            resultArray[i] !== "correct" && wordleArray.includes(letter) && letterCount[letter] > 0) {
            resultArray[i] = "present";
            letterCount[letter] = letterCount[letter] - 1;
        }
    }

    if (resultArray.every(el => el === 'correct')) completed = true;

    console.log("");
    console.log("DEBUGGER:");
    console.log("Results Array: " + resultArray);
    console.log("Correct: " + state.wordleWord.join(''));
    console.log("Guess: " + state.currentGuess.join(''));
    console.log("Letter Count: " + Object.entries(letterCount));
    console.log("Wordle Array: " + wordleArray);
    console.log("Guess Array: " + guessArray);

    updateDisplay(resultArray, completed);
    handleResult(completed);
}

function updateDisplay(resultArray, result) {  
    let currentRow = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
    let tiles = currentRow.querySelectorAll('.tile');
    let keyChanges = {};
    for (let i = 0; i < resultArray.length; i++) {
        if (resultArray[i] === "correct") {
            tiles[i].classList.add('color-correct');
            keyChanges[state.currentGuess[i]] = resultArray[i];
        }
        else if (resultArray[i] === "present") {
            tiles[i].classList.add('color-present');
            keyChanges[state.currentGuess[i]] = resultArray[i];
        }
        else {
            tiles[i].classList.add('color-absent');
            keyChanges[state.currentGuess[i]] = resultArray[i];
        }
    }    
    let container = document.getElementById('keys');
    let keys = container.querySelectorAll('.key');
    for (let key of keys) {
        if (key.dataset.key.toLowerCase() in keyChanges) {
            key.classList.add(`key-${keyChanges[key.dataset.key.toLowerCase()]}`);
        } 
    }
}

function handleResult(result) {
    state.currentGuess = [];
    if (state.currentTileRow >= 6 || result || state.gameEnded || state.completed) {
        if (result) {
            let currentRow = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
            let tiles = currentRow.querySelectorAll(`.tile`);
            let delay = 0;
            for (let tile of tiles) {
                setTimeout(() => {
                    tile.classList.add('animation-bounce');
                }, delay);
                delay += 400;
            }
            setTimeout(() => endGame("completed"), delay + 500);
        }
        else return endGame("tries");
    }
    else {
        let currentRow = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
        let tiles = currentRow.querySelectorAll('.tile');

        for (let tile of tiles) {
            tile.classList.remove('active');
        }

        state.currentTileRow++;
        state.currentTile = 1;

        setTimeout(() => {
            let row = document.querySelector(`.row[data-row="${state.currentTileRow}"]`);
            let tile = row.querySelector(`.tile[data-tile="1"]`);
            if (tile) tile.classList.add('active');
        }, 0);
    }
}

function endGame(type) {
    if (type === "completed") {
        state.completed = true;
    }
    let container = document.getElementById('keys');
    let keys = container.querySelectorAll('.key');
    for (let key of keys) {
        key.classList.add('key-disabled');
    }
    state.gameEnded = true;
    openModal(type);
}

function openModal(type) {
    let outerContainer = document.querySelector(`.modal-outer`);
    let innerContainer = document.querySelector(`.modal-inner`);
    let heading = '';
    let message = '';
    console.log(type);
    switch (type) {
        case "completed":
            heading = `Nice, you got it!`;
            message = `
                You guessed the right word: <b>${state.wordleWord.join('').toUpperCase()}</b>.
            `
            break;
        case "tries":
            heading = `Better luck next time!`;
            message = `
                You've ran of out of tries. The correct word was <b>${state.wordleWord.join('').toUpperCase()}</b>.
            `
            break;
    }
    innerContainer.innerHTML = `<h3><b>${heading}</b></h3>&nbsp;<p>${message}</p>&nbsp;<button class="button" onclick="location.reload();">Play Again</button>`;
    outerContainer.classList.add('open');
    outerContainer.addEventListener('click', (event) => {
        if (event.target === outerContainer) {
            outerContainer.classList.remove('open');
        }
    });
}

function closeModal(message) {
    let outerContainer = document.querySelector(`.modal-outer`);
    outerContainer.classList.remove('open');
}

function modalIsOpen() {
    let outerContainer = document.querySelector(`.modal-outer`);
    return outerContainer.classList.contains('open');
}

// Call main()
main();
/*
=========================================
Princehacky Cube Trainer
pattern.js
Version 1.0
=========================================
*/

"use strict";

const PatternGenerator = {

    /* Available colours */

    colors: [
        "#ffffff", // White
        "#ffd500", // Yellow
        "#ff0000", // Red
        "#ff7b00", // Orange
        "#0066ff", // Blue
        "#00b050"  // Green
    ],

    centerColor: "#ffffff",

    currentPattern: [],

    generate() {

        const cells = document.querySelectorAll(".cube-face .cell");

        if (!cells.length) {
            return;
        }

        this.currentPattern = [];

        cells.forEach((cell, index) => {

            let color;

            if (index === 4) {

                /* Center sticker never changes */

                color = this.centerColor;

            } else {

                color = this.randomColor();

            }

            cell.style.background = color;

            cell.dataset.color = color;

            this.currentPattern.push(color);

        });

        console.log("Pattern generated.");

    },

    randomColor() {

        const index = Math.floor(
            Math.random() * this.colors.length
        );

        return this.colors[index];

    },

    setCenter(color) {

        this.centerColor = color;

        this.generate();

    },

    getPattern() {

        return [...this.currentPattern];

    },

    copyPattern() {

        navigator.clipboard.writeText(
            JSON.stringify(this.currentPattern)
        ).then(() => {

            alert("Pattern copied.");

        }).catch(() => {

            alert("Clipboard unavailable.");

        });

    },

    loadPattern(pattern) {

        if (!Array.isArray(pattern)) {
            return;
        }

        const cells = document.querySelectorAll(".cube-face .cell");

        if (pattern.length !== cells.length) {
            return;
        }

        pattern.forEach((color, index) => {

            cells[index].style.background = color;
            cells[index].dataset.color = color;

        });

        this.currentPattern = [...pattern];

    },

    reset() {

        this.generate();

    }

};

/* Generate a pattern immediately
   if this file loads after HTML */

window.addEventListener("DOMContentLoaded", () => {

    PatternGenerator.generate();
if (typeof UI !== "undefined") {
    UI.flashCube();
}
});

/*
=========================================
Princehacky Cube Trainer
ui.js
Version 1.0
=========================================
*/

"use strict";

const UI = {

    notificationTimeout: null,

    init() {

        this.cache();

        this.updateStats();

        console.log("UI Ready");

    },

    cache() {

        this.cells =
            document.querySelectorAll(".cube-face .cell");

        this.timer =
            document.getElementById("timer");

        this.bestTime =
            document.getElementById("bestTime");

    },

    /* ---------- Cube ---------- */

    flashCube() {

        this.cells.forEach((cell, index) => {

            cell.style.transform = "scale(0.92)";

            setTimeout(() => {

                cell.style.transform = "scale(1)";

            }, 120 + (index * 20));

        });

    },

    highlightCenter() {

        if (this.cells.length > 4) {

            this.cells[4].style.boxShadow =
                "0 0 20px #22c55e";

        }

    },

    clearHighlight() {

        if (this.cells.length > 4) {

            this.cells[4].style.boxShadow = "";

        }

    },

    /* ---------- Timer ---------- */

    pulseTimer() {

        if (!this.timer) return;

        this.timer.animate([

            {
                transform: "scale(1)"
            },

            {
                transform: "scale(1.12)"
            },

            {
                transform: "scale(1)"
            }

        ], {

            duration: 250

        });

    },

    /* ---------- Best Time ---------- */

    celebrateBestTime() {

        this.showMessage(
            "🏆 New Best Time!"
        );

        this.pulseTimer();

    },

    /* ---------- Notifications ---------- */

    showMessage(text) {

        let box =
            document.getElementById("cubeMessage");

        if (!box) {

            box = document.createElement("div");

            box.id = "cubeMessage";

            box.style.position = "fixed";
            box.style.bottom = "25px";
            box.style.right = "25px";
            box.style.background = "#22c55e";
            box.style.color = "#fff";
            box.style.padding = "12px 20px";
            box.style.borderRadius = "10px";
            box.style.fontWeight = "bold";
            box.style.boxShadow =
                "0 8px 20px rgba(0,0,0,.35)";
            box.style.zIndex = "9999";

            document.body.appendChild(box);

        }

        box.textContent = text;

        box.style.display = "block";

        clearTimeout(this.notificationTimeout);

        this.notificationTimeout =

            setTimeout(() => {

                box.style.display = "none";

            }, 2500);

    },

    /* ---------- Statistics ---------- */

    updateStats() {

        if (typeof StorageManager === "undefined") {

            return;

        }

        const stats =
            StorageManager.getStats();

        console.table(stats);

    },

    /* ---------- Buttons ---------- */

    disableButtons(disabled) {

        const ids = [

            "generateBtn",
            "startBtn",
            "stopBtn",
            "resetBtn"

        ];

        ids.forEach(id => {

            const button =
                document.getElementById(id);

            if (button) {

                button.disabled = disabled;

            }

        });

    },

    /* ---------- Theme ---------- */

    toggleDarkMode() {

        document.body.classList.toggle("dark");

    }

};

window.addEventListener(

    "DOMContentLoaded",

    () => {

        UI.init();

        UI.highlightCenter();

    }

);

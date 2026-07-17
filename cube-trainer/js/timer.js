/*
=========================================
Princehacky Cube Trainer
timer.js
Version 1.0
=========================================
*/

"use strict";

const Timer = {

    startTime: 0,
    elapsed: 0,
    interval: null,
    running: false,

    display: null,

    init() {

        this.display = document.getElementById("timer");

        this.updateDisplay(0);

    },

    start() {

        if (this.running) {
            return;
        }

        this.running = true;

        this.startTime =
            performance.now() - this.elapsed;

        this.interval = setInterval(() => {

            this.elapsed =
                performance.now() - this.startTime;

            this.updateDisplay(this.elapsed);

        }, 10);

    },

    stop() {

        if (!this.running) {
            return;
        }

        clearInterval(this.interval);

        this.running = false;

        this.updateDisplay(this.elapsed);

        console.log(
            "Finished in",
            this.format(this.elapsed)
        );

        if (typeof StorageManager !== "undefined") {

            StorageManager.saveBestTime(
                this.elapsed
            );

        }

    },

    reset() {

        clearInterval(this.interval);

        this.running = false;

        this.elapsed = 0;

        this.updateDisplay(0);

    },

    updateDisplay(milliseconds) {

        if (!this.display) {
            this.display =
                document.getElementById("timer");
        }

        if (!this.display) {
            return;
        }

        this.display.textContent =
            this.format(milliseconds);

    },

    format(milliseconds) {

        const total =
            Math.floor(milliseconds);

        const minutes =
            Math.floor(total / 60000);

        const seconds =
            Math.floor((total % 60000) / 1000);

        const hundredths =
            Math.floor((total % 1000) / 10);

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0") +
            "." +
            String(hundredths).padStart(2, "0")
        );

    },

    getTime() {

        return this.elapsed;

    },

    isRunning() {

        return this.running;

    }

};

window.addEventListener("DOMContentLoaded", () => {

    Timer.init();

});

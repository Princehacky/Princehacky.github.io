/*
=========================================
Princehacky Cube Trainer
app.js
Version 1.0
=========================================
*/

"use strict";

const CubeTrainer = {

    version: "1.0.0",

    started: false,

    init() {

        console.log(
            "%cCube Trainer Loaded",
            "color:#22c55e;font-size:16px;font-weight:bold;"
        );

        this.cache();

        this.events();

        if (typeof StorageManager !== "undefined") {
            StorageManager.loadBestTime();
        }

        if (typeof PatternGenerator !== "undefined") {
            PatternGenerator.generate();
        }

    },

    cache() {

        this.generateBtn =
            document.getElementById("generateBtn");

        this.startBtn =
            document.getElementById("startBtn");

        this.stopBtn =
            document.getElementById("stopBtn");

        this.resetBtn =
            document.getElementById("resetBtn");

    },

    events() {

        if (this.generateBtn) {

            this.generateBtn.addEventListener("click", () => {

                if (typeof PatternGenerator !== "undefined") {

                    PatternGenerator.generate();

                }

            });

        }

        if (this.startBtn) {

            this.startBtn.addEventListener("click", () => {

                if (this.started) return;

                this.started = true;

                if (typeof Timer !== "undefined") {

                    Timer.start();

                }

            });

        }

        if (this.stopBtn) {

            this.stopBtn.addEventListener("click", () => {

                if (!this.started) return;

                this.started = false;

                if (typeof Timer !== "undefined") {

                    Timer.stop();

                }

            });

        }

        if (this.resetBtn) {

            this.resetBtn.addEventListener("click", () => {

                this.started = false;

                if (typeof Timer !== "undefined") {

                    Timer.reset();

                }

            });

        }

        document.addEventListener("keydown", (event) => {

            switch (event.key.toLowerCase()) {

                case "g":

                    if (typeof PatternGenerator !== "undefined") {

                        PatternGenerator.generate();

                    }

                    break;

                case "s":

                    if (!this.started) {

                        this.started = true;

                        if (typeof Timer !== "undefined") {

                            Timer.start();

                        }

                    }

                    break;

                case "x":

                    if (this.started) {

                        this.started = false;

                        if (typeof Timer !== "undefined") {

                            Timer.stop();

                        }

                    }

                    break;

                case "r":

                    this.started = false;

                    if (typeof Timer !== "undefined") {

                        Timer.reset();

                    }

                    break;

            }

        });

    }

};

window.addEventListener("DOMContentLoaded", () => {

    CubeTrainer.init();

});

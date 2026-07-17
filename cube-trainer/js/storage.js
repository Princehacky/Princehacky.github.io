/*
=========================================
Princehacky Cube Trainer
storage.js
Version 1.0
=========================================
*/

"use strict";

const StorageManager = {

    keys: {

        bestTime: "ph_cube_best_time",
        totalSolves: "ph_cube_total_solves",
        totalTime: "ph_cube_total_time",
        settings: "ph_cube_settings"

    },

    /* ---------- Best Time ---------- */

    loadBestTime() {

        const value = localStorage.getItem(this.keys.bestTime);

        if (value === null) {

            this.updateBestTime("--");

            return null;

        }

        const time = Number(value);

        if (!isNaN(time)) {

            this.updateBestTime(
                Timer.format(time)
            );

        }

        return time;

    },

    saveBestTime(time) {

        if (typeof time !== "number") {
            return;
        }

        const current =
            Number(localStorage.getItem(this.keys.bestTime));

        if (!current || time < current) {

            localStorage.setItem(
                this.keys.bestTime,
                time
            );

            this.updateBestTime(
                Timer.format(time)
            );

            console.log("🏆 New Best Time!");

        }

        this.incrementStats(time);

    },

    updateBestTime(text) {

        const element =
            document.getElementById("bestTime");

        if (element) {

            element.textContent = text;

        }

    },

    /* ---------- Statistics ---------- */

    incrementStats(time) {

        let solves =
            Number(localStorage.getItem(this.keys.totalSolves)) || 0;

        let totalTime =
            Number(localStorage.getItem(this.keys.totalTime)) || 0;

        solves++;

        totalTime += time;

        localStorage.setItem(
            this.keys.totalSolves,
            solves
        );

        localStorage.setItem(
            this.keys.totalTime,
            totalTime
        );

    },

    getStats() {

        const solves =
            Number(localStorage.getItem(this.keys.totalSolves)) || 0;

        const totalTime =
            Number(localStorage.getItem(this.keys.totalTime)) || 0;

        return {

            solves,

            totalTime,

            average:
                solves === 0
                    ? 0
                    : totalTime / solves

        };

    },

    /* ---------- Settings ---------- */

    saveSettings(settings) {

        localStorage.setItem(

            this.keys.settings,

            JSON.stringify(settings)

        );

    },

    loadSettings() {

        const raw =
            localStorage.getItem(this.keys.settings);

        if (!raw) {

            return {};

        }

        try {

            return JSON.parse(raw);

        }

        catch {

            return {};

        }

    },

    /* ---------- Reset ---------- */

    clearAll() {

        Object.values(this.keys).forEach(key => {

            localStorage.removeItem(key);

        });

        this.updateBestTime("--");

        console.log("Storage cleared.");

    }

};

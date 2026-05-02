"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        environment: "node",
        coverage: {
            provider: "v8",
            reportsDirectory: "./coverage",
            include: ["src/**/*.ts"],
        },
    },
});
//# sourceMappingURL=vitest.config.js.map
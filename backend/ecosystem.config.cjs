module.exports = {
    apps: [
        {
            name: "gizilens-backend",
            script: "bun .dist/server.js",
            env: {
                NODE_ENV: "development",
            },
            watch: false
        }
    ]
};

const { PostHog } = require('posthog-node');

const posthog = new PostHog(process.env.POSTHOG_API_KEY);

module.exports = posthog;
import { definePlugin } from '@opoha/plugin-sdk';

/** Event name used by the sample plugin listener (plugin-system-design early verification). */
export const PLUGIN_SAMPLE_EVENT = 'PluginSampleEvent' as const;

/**
 * Minimal official-shaped sample plugin for loader integration tests (D-11).
 * Registers: GraphQL ping query, one permission, one PluginSampleEvent listener.
 */
export default definePlugin({
  id: 'sample',
  boot(ctx) {
    ctx.registerGraphQL({
      name: 'samplePing',
      kind: 'query',
      descriptor: { resolve: () => 'pong' },
    });
    ctx.registerProvider({
      token: 'sample.ping',
      provider: { ping: () => 'pong' },
    });
    ctx.registerListener(PLUGIN_SAMPLE_EVENT, () => {
      // Side-effect-free stub; hosts assert via ContributionRegistry / event bus.
    });
    ctx.registerAdmin({
      navigation: [
        {
          id: 'sample-nav',
          label: 'Sample',
          path: '/plugins/sample',
          permission: 'plugin:sample:read',
        },
      ],
      permissions: ['plugin:sample:read'],
    });
  },
});

import { describe, expect, it } from 'vitest';

import sample, { PLUGIN_SAMPLE_EVENT } from './index.js';

describe('@opoha/plugin-sample', () => {
  it('exports definePlugin definition with sample id', () => {
    expect(sample.id).toBe('sample');
    expect(typeof sample.boot).toBe('function');
    expect(PLUGIN_SAMPLE_EVENT).toBe('PluginSampleEvent');
  });
});

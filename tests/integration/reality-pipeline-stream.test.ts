import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApp } from '../../apps/api/dist/index.js';
import {
  PIPELINE_STREAM_FRAMES,
  PIPELINE_STREAM_NOMINAL_FPS,
  buildPipelineEventStream,
  runRealityPipeline,
} from '../../apps/api/src/reality-tools-route.ts';

test('the pipeline stream is a bounded 30fps sample of the sealed default execution', () => {
  const first = buildPipelineEventStream();
  const second = buildPipelineEventStream();
  assert.equal(first.contentType, 'text/event-stream');
  assert.equal(first.body, second.body);
  assert.equal(first.body.match(/event: frame/g)?.length, PIPELINE_STREAM_FRAMES);
  assert.equal(first.body.match(/event: stage/g)?.length, 3);
  assert.match(first.body, /"nominalFps":30/);
  assert.match(first.body, /"continuous":false/);
  assert.equal(PIPELINE_STREAM_NOMINAL_FPS, 30);
  const seal = first.body.split('event: seal\n')[1] ?? '';
  const data = JSON.parse(seal.replace(/^data: /, '').trim()) as { status: string; frames: number };
  assert.equal(data.status, 'VERIFIED');
  assert.equal(data.frames, 8);
});

test('GET /v1/reality/pipeline/stream serves that sample and then closes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'omega-pipeline-stream-'));
  const app = createApp(join(directory, 'ledger.db'), false, { allowUnsignedCycle: true });
  try {
    await app.ready();
    const response = await app.inject({ method: 'GET', url: '/v1/reality/pipeline/stream' });
    assert.equal(response.statusCode, 200);
    assert.match(String(response.headers['content-type']), /text\/event-stream/);
    assert.equal(response.body.match(/event: frame/g)?.length, PIPELINE_STREAM_FRAMES);
    assert.match(response.body, /"continuous":false/);
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a divergent DAV stage does not become a stream or an execution', () => {
  const ran = runRealityPipeline('live-continuum', [
    { toolId: 'tool-dav-tensor-validator', params: { size: 4 } },
  ]);
  assert.equal(ran.ok, false);
  if (ran.ok) return;
  assert.equal(ran.status, 'UNKNOWN');
  assert.equal(ran.completedStages, 0);
  assert.match(ran.error, /expected 57344/);
});

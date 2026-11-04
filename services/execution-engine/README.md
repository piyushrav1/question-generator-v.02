# Execution Engine

This service owns submission execution and evaluation behavior.

The current implementation is a development evaluator. Production submissions must be passed to isolated workers or containers with strict time, memory, network, filesystem, and process controls.

## Planned Files

- Submission queues and workers.
- Language-specific runner implementations.
- Container configuration.
- Verdict normalization.
- Runtime and memory metrics.
- Output comparison.

# Architecture — independent UI semantics

This package intentionally separates backend authority from UI representation.

~~~mermaid
flowchart TD
    A["Core authority（核心业务权威）<br/>Auth / Scope / Effects"] --> B["Host read port（宿主读取端口）"]
    B --> C["Translator（语义翻译器）<br/>typed values / provenance"]
    C --> D["TableViewPort（通用展示端口）<br/>renderer-independent"]
    D --> E["Optional FA adapter（可选 FA 适配器）"]
    D -.-> F["Other renderer（其他渲染器）"]
    E --> G["FA components（FA 展示组件）"]
    H["UiModuleSlot（UI 生命周期模块）"] -.-> I["Host router and view resources（宿主路由与视图资源）"]
~~~

## Ownership

| Responsibility | Owner |
|---|---|
| Authentication, tenant scope, business commands, audit | Core backend and trusted host |
| Transport and current UI workspace session | Application host |
| Deterministic field projection and typed view values | This package |
| Presentation components, navigation and view disposal | Renderer host |
| Core command execution and stream lifecycle | Core runtime, not UiModuleSlot |

## Boundaries

The core does not fetch credentials, register arbitrary remote modules, execute business commands, choose tenant access, infer available server actions, or turn UI metadata into permissions.

The presentation contract preserves value, null, missing and unsupported states. The optional FA adapter formats these states for text-only display; the translator must not depend on FA column props or Vue component lifecycles.

UiModuleSlot is an experimental coordinator for **host-observed UI leases**. It can reject new UI activity during draining and prioritize local revocation. It is not a backend command lock, hot code signing system, security sandbox, or guarantee of zero-downtime plugin replacement.

See [API Contracts](API.md) and [Security](../SECURITY.md).

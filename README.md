# BlazorFastSpoiler

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://zettersten.github.io/BlazorFastSpoiler/)

A standalone Blazor component that hides spoiler content behind a canvas-based particle mask. Click (or press Enter/Space) to reveal.

## Live demo

`https://zettersten.github.io/BlazorFastSpoiler/`

## Installation

```bash
dotnet add package BlazorFastSpoiler
```

## Usage

Add the using directive to your `_Imports.razor`:

```razor
@using BlazorFastSpoiler.Components
```

Use the component:

```razor
<BlazorFastSpoiler>
    Darth Vader is Luke's father
</BlazorFastSpoiler>
```

## Parameters

| Parameter | Type | Default | Notes |
|---|---:|---:|---|
| `Scale` | `double` | `1.0` | Particle size multiplier |
| `MinVelocity` | `double` | `0.01` | Minimum particle velocity |
| `MaxVelocity` | `double` | `0.05` | Maximum particle velocity |
| `ParticleLifetime` | `int` | `120` | Particle lifetime (frames @ ~60fps) |
| `Density` | `double` | `8.0` | Particles per 100px² |
| `RevealDuration` | `int` | `300` | Text fade-in duration (ms) |

## Notes / best practices

- **Accessibility**: rendered as a keyboard-focusable element (`role="button"`, `tabindex=0`) until revealed.
- **SSR / prerendering**: if JS interop isn’t available, initialization is skipped and the component becomes a no-op (content remains hidden by CSS). If you need SSR-friendly “show spoilers by default”, we can add a parameter for that behavior.
- **Performance**: animation is driven by JavaScript `requestAnimationFrame`; C# is only used for lifecycle and reveal state.

## Development

```bash
dotnet build
dotnet test
```

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md).

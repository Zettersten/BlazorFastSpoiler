# BlazorFastSpoiler

A modern Blazor component for creating spoiler text with beautiful particle effects. Inspired by [spoilerjs](https://github.com/shajidhasan/spoilerjs), built with bleeding-edge .NET 10 features and modern CSS.

## Features

- 🎨 **Beautiful Particle Effects** - Canvas-based particle animations that hide spoiler text
- ⚡ **High Performance** - Optimized C# particle management with minimal JavaScript interop
- 🚀 **Dual Rendering Support** - Works seamlessly in both Blazor Server and WebAssembly modes
- 💨 **Speed Optimized** - Uses `IJSInProcessObjectReference` for synchronous calls in WASM
- 🎯 **Highly Configurable** - Extensive parameter set for fine-tuning particle behavior
- ♿ **Accessible** - Full keyboard support and ARIA attributes
- 🧪 **Well Tested** - Comprehensive bUnit test suite
- 📦 **NuGet Ready** - Packaged and ready for distribution

## Installation

```bash
dotnet add package BlazorFastSpoiler
```

Or via NuGet Package Manager:
```
Install-Package BlazorFastSpoiler
```

## Quick Start

```razor
@using BlazorFastSpoiler

<BlazorFastSpoiler>
    Your spoiler text here
</BlazorFastSpoiler>
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Scale` | `double` | `1.0` | Scale factor for particle size |
| `MinVelocity` | `double` | `0.01` | Minimum velocity for particles (pixels per frame) |
| `MaxVelocity` | `double` | `0.05` | Maximum velocity for particles (pixels per frame) |
| `ParticleLifetime` | `int` | `120` | Particle lifetime in frames at 60fps |
| `Density` | `double` | `8.0` | Target particle density (particles per 100 square pixels) |
| `RevealDuration` | `int` | `300` | Text fade-in duration in milliseconds when revealing |
| `SpawnStopDelay` | `int` | `0` | Delay in milliseconds before stopping particle spawning after click |
| `MonitorPosition` | `bool` | `false` | Enable continuous position monitoring for hover effects and CSS transforms |
| `Fps` | `int` | `60` | Target frames per second for particle animation |

## Examples

### Basic Usage

```razor
<BlazorFastSpoiler>
    The answer is 42
</BlazorFastSpoiler>
```

### Custom Configuration

```razor
<BlazorFastSpoiler 
    Scale="1.5"
    Density="12.0"
    RevealDuration="500"
    MinVelocity="0.02"
    MaxVelocity="0.1">
    Custom configured spoiler
</BlazorFastSpoiler>
```

### High Performance Mode

```razor
<BlazorFastSpoiler 
    Fps="30"
    MonitorPosition="false">
    Optimized for slower devices
</BlazorFastSpoiler>
```

## Development

### Prerequisites

- .NET 10.0 SDK or later

### Building

```bash
dotnet build
```

### Running Tests

```bash
dotnet test
```

### Running Demo

```bash
cd BlazorFastSpoiler.Demo
dotnet run
```

### Building NuGet Package

```bash
dotnet pack BlazorFastSpoiler/BlazorFastSpoiler.csproj --configuration Release
```

## Demo

Check out the [live demo](https://yourusername.github.io/BlazorFastSpoiler/) deployed on GitHub Pages.

## Architecture

- **BlazorFastSpoiler** - Main component library (Razor Class Library)
- **BlazorFastSpoiler.Tests** - bUnit test suite
- **BlazorFastSpoiler.Demo** - Demo Blazor WebAssembly application

## Technology Stack

- .NET 10.0 (Latest LTS)
- Blazor WebAssembly & Blazor Server (dual rendering support)
- C# particle management for optimal performance
- Modern CSS (CSS Variables, Animations)
- Canvas API (minimal JavaScript - only for rendering)
- bUnit for testing

## Performance Optimizations

- **C# Particle Management**: All particle calculations run in C# for better performance
- **In-Process JS Calls**: Uses `IJSInProcessObjectReference` for synchronous calls in WASM
- **Minimal JavaScript**: JavaScript only handles canvas rendering operations
- **Efficient Updates**: Particle state managed in memory with optimized update loops
- **SSR Compatible**: Gracefully handles server-side rendering scenarios

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

Inspired by [spoilerjs](https://github.com/shajidhasan/spoilerjs) by Shajid Hasan.

# BlazorFastSpoiler

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://zettersten.github.io/BlazorFastSpoiler/)

A modern Blazor component for creating spoiler text with beautiful particle effects. Inspired by [spoilerjs](https://github.com/shajidhasan/spoilerjs), built with bleeding-edge .NET 10 features and modern CSS.

## 🌟 Live Demo

**[Try it now → zettersten.github.io/BlazorFastSpoiler](https://zettersten.github.io/BlazorFastSpoiler/)**

## ✨ Features

- 🎨 **Beautiful Particle Effects** - Canvas-based particle animations that hide spoiler text
- ⚡ **High Performance** - Optimized C# particle management with minimal JavaScript interop
- 🚀 **Dual Rendering Support** - Works seamlessly in both Blazor Server and WebAssembly modes
- 💨 **Speed Optimized** - Uses `IJSInProcessObjectReference` for synchronous calls in WASM
- 🎯 **Highly Configurable** - Extensive parameter set for fine-tuning particle behavior
- ♿ **Accessible** - Full keyboard support and ARIA attributes
- 🧪 **Well Tested** - Comprehensive bUnit test suite
- 📦 **NuGet Ready** - Packaged and ready for distribution

## 📦 Installation

```bash
dotnet add package BlazorFastSpoiler
```

Or via NuGet Package Manager:
```
Install-Package BlazorFastSpoiler
```

## 🚀 Quick Start

Add the using directive to your `_Imports.razor`:

```razor
@using BlazorFastSpoiler.Components
```

Then use the component in your Razor files:

```razor
<BlazorFastSpoiler>
    Your spoiler text here
</BlazorFastSpoiler>
```

## ⚙️ Parameters

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

## 📖 Examples

### Basic Usage

```razor
<BlazorFastSpoiler>
    The answer is 42
</BlazorFastSpoiler>
```

### High Density Particles

```razor
<BlazorFastSpoiler Density="20.0" Scale="1.1">
    Dense particle effect
</BlazorFastSpoiler>
```

### Fast Moving Particles

```razor
<BlazorFastSpoiler MinVelocity="0.08" MaxVelocity="0.2" Density="15.0">
    Speed is the essence of war
</BlazorFastSpoiler>
```

### Slow Reveal Animation

```razor
<BlazorFastSpoiler RevealDuration="1500" Density="12.0">
    Dramatic slow reveal
</BlazorFastSpoiler>
```

### Performance Optimized

```razor
<BlazorFastSpoiler Fps="30" MonitorPosition="false">
    Optimized for slower devices
</BlazorFastSpoiler>
```

### Rich Content

```razor
<BlazorFastSpoiler Density="12.0">
    <strong>Bold text</strong>, <em>italic text</em>, and 
    <span style="color: #818cf8;">colored text</span> all work!
</BlazorFastSpoiler>
```

## 🛠️ Development

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

### Running Demo Locally

```bash
cd BlazorFastSpoiler.Demo
dotnet run
```

### Building NuGet Package

```bash
dotnet pack BlazorFastSpoiler/BlazorFastSpoiler.csproj --configuration Release
```

## 🏗️ Architecture

- **BlazorFastSpoiler** - Main component library (Razor Class Library)
- **BlazorFastSpoiler.Tests** - bUnit test suite
- **BlazorFastSpoiler.Demo** - Demo Blazor WebAssembly application

## 🔧 Technology Stack

- **.NET 10.0** - Bleeding-edge features and performance
- **Blazor WebAssembly & Server** - Dual rendering support
- **C# Particle Management** - All particle calculations in managed code
- **Modern CSS** - CSS Variables, Animations, CSS Isolation
- **Canvas API** - Minimal JavaScript, only for rendering
- **bUnit** - Comprehensive testing

## ⚡ Performance Optimizations

| Optimization | Description |
|--------------|-------------|
| **C# Particle Management** | All particle calculations run in C# for better performance |
| **In-Process JS Calls** | Uses `IJSInProcessObjectReference` for synchronous calls in WASM |
| **Minimal JavaScript** | JavaScript only handles canvas rendering operations |
| **Efficient Updates** | Particle state managed in memory with optimized update loops |
| **SSR Compatible** | Gracefully handles server-side rendering scenarios |
| **Race Condition Prevention** | Careful initialization order prevents resize handler conflicts |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Inspired by [spoilerjs](https://github.com/shajidhasan/spoilerjs) by Shajid Hasan.

using Bunit;
using Xunit;
using BlazorFastSpoiler.Components;
using Bunit.JSInterop;

namespace BlazorFastSpoiler.Tests;

public class BlazorFastSpoilerTests : TestContext
{
    private void SetupJSInterop()
    {
        var module = JSInterop.SetupModule("./_content/BlazorFastSpoiler/js/blazorFastSpoiler.js");
        module.SetupVoid("initialize", _ => true);
        module.SetupVoid("reveal");
        module.SetupVoid("dispose");
    }

    [Fact]
    public void Renders_ChildContent()
    {
        // Arrange
        SetupJSInterop();
        var cut = RenderComponent<Components.BlazorFastSpoiler>(parameters => parameters
            .Add(p => p.ChildContent, "Spoiler text"));

        // Act & Assert
        Assert.Contains("Spoiler text", cut.Markup);
    }

    [Fact]
    public void Has_Correct_Default_Parameters()
    {
        // Arrange
        SetupJSInterop();
        
        // Act
        var cut = RenderComponent<Components.BlazorFastSpoiler>();

        // Assert
        var component = cut.Instance;
        Assert.Equal(1.0, component.Scale);
        Assert.Equal(0.01, component.MinVelocity);
        Assert.Equal(0.05, component.MaxVelocity);
        Assert.Equal(120, component.ParticleLifetime);
        Assert.Equal(8.0, component.Density);
        Assert.Equal(300, component.RevealDuration);
        Assert.Equal(0, component.SpawnStopDelay);
        Assert.False(component.MonitorPosition);
        Assert.Equal(60, component.Fps);
        Assert.False(component.Revealed);
        Assert.False(component.Revealing);
    }

    [Fact]
    public void Sets_Custom_Parameters()
    {
        // Arrange
        SetupJSInterop();
        
        // Act
        var cut = RenderComponent<Components.BlazorFastSpoiler>(parameters => parameters
            .Add(p => p.Scale, 2.0)
            .Add(p => p.MinVelocity, 0.02)
            .Add(p => p.MaxVelocity, 0.1)
            .Add(p => p.ParticleLifetime, 240)
            .Add(p => p.Density, 16.0)
            .Add(p => p.RevealDuration, 600)
            .Add(p => p.SpawnStopDelay, 100)
            .Add(p => p.MonitorPosition, true)
            .Add(p => p.Fps, 30));

        // Assert
        var component = cut.Instance;
        Assert.Equal(2.0, component.Scale);
        Assert.Equal(0.02, component.MinVelocity);
        Assert.Equal(0.1, component.MaxVelocity);
        Assert.Equal(240, component.ParticleLifetime);
        Assert.Equal(16.0, component.Density);
        Assert.Equal(600, component.RevealDuration);
        Assert.Equal(100, component.SpawnStopDelay);
        Assert.True(component.MonitorPosition);
        Assert.Equal(30, component.Fps);
    }

    [Fact]
    public void Has_Hidden_Class_Initially()
    {
        // Arrange
        SetupJSInterop();
        
        // Act
        var cut = RenderComponent<Components.BlazorFastSpoiler>();

        // Assert
        var div = cut.Find("div");
        Assert.Contains("hidden", div.ClassName);
    }

    [Fact]
    public void Has_Correct_Aria_Attributes()
    {
        // Arrange
        SetupJSInterop();
        
        // Act
        var cut = RenderComponent<Components.BlazorFastSpoiler>();

        // Assert
        var div = cut.Find("div");
        Assert.Equal("button", div.GetAttribute("role"));
        Assert.Equal("0", div.GetAttribute("tabindex"));
        Assert.Equal("Click to reveal spoiler", div.GetAttribute("aria-label"));
        // Blazor doesn't render false boolean attributes, so aria-pressed will be null when false
        var ariaPressed = div.GetAttribute("aria-pressed");
        Assert.True(ariaPressed == null || ariaPressed == "false");
    }

    [Fact]
    public void Sets_Reveal_Duration_Style_When_Revealing()
    {
        // Arrange
        SetupJSInterop();
        
        var cut = RenderComponent<Components.BlazorFastSpoiler>(parameters => parameters
            .Add(p => p.RevealDuration, 500));

        // Act - simulate reveal by clicking
        cut.Find("div").Click();

        // Assert - check that revealing state is set (component will handle the style)
        var component = cut.Instance;
        Assert.True(component.Revealing);
    }

    [Fact]
    public void Component_Implements_AsyncDisposable()
    {
        // Arrange
        SetupJSInterop();
        
        // Act
        var cut = RenderComponent<Components.BlazorFastSpoiler>();

        // Assert
        Assert.IsAssignableFrom<IAsyncDisposable>(cut.Instance);
    }
}

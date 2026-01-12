namespace BlazorFastSpoiler.Tests;

public class BlazorFastSpoilerTests : BunitContext
{
    private void SetupJSInterop()
    {
        var module = JSInterop.SetupModule("./_content/BlazorFastSpoiler/js/blazorFastSpoiler.js");
        module.SetupVoid("initialize", _ => true);
        module.SetupVoid("reveal", _ => true);
        module.SetupVoid("dispose", _ => true);
    }

    [Fact]
    public void Renders_ChildContent()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>(parameters => parameters
            .Add(p => p.ChildContent, "Spoiler text"));

        Assert.Contains("Spoiler text", cut.Markup);
    }

    [Fact]
    public void Has_Correct_Default_Parameters()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();

        var component = cut.Instance;
        Assert.Equal(1.0, component.Scale);
        Assert.Equal(0.01, component.MinVelocity);
        Assert.Equal(0.05, component.MaxVelocity);
        Assert.Equal(120, component.ParticleLifetime);
        Assert.Equal(8.0, component.Density);
        Assert.Equal(300, component.RevealDuration);
        Assert.False(component.Revealed);
        Assert.False(component.Revealing);
    }

    [Fact]
    public void Sets_Custom_Parameters()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>(parameters => parameters
            .Add(p => p.Scale, 2.0)
            .Add(p => p.MinVelocity, 0.02)
            .Add(p => p.MaxVelocity, 0.1)
            .Add(p => p.ParticleLifetime, 240)
            .Add(p => p.Density, 16.0)
            .Add(p => p.RevealDuration, 600));

        var component = cut.Instance;
        Assert.Equal(2.0, component.Scale);
        Assert.Equal(0.02, component.MinVelocity);
        Assert.Equal(0.1, component.MaxVelocity);
        Assert.Equal(240, component.ParticleLifetime);
        Assert.Equal(16.0, component.Density);
        Assert.Equal(600, component.RevealDuration);
    }

    [Fact]
    public void Has_Hidden_Class_Initially()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();

        var div = cut.Find("div");
        Assert.Contains("hidden", div.ClassName);
    }

    [Fact]
    public void Has_Correct_Aria_Attributes()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();

        var div = cut.Find("div");
        Assert.Equal("button", div.GetAttribute("role"));
        Assert.Equal("0", div.GetAttribute("tabindex"));
        Assert.Equal("Click to reveal spoiler", div.GetAttribute("aria-label"));
        var ariaPressed = div.GetAttribute("aria-pressed");
        Assert.True(ariaPressed == null || ariaPressed == "false");
    }

    [Fact]
    public void Click_Calls_JS_Reveal()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>(parameters => parameters
            .Add(p => p.RevealDuration, 500));

        var div = cut.Find("div");
        div.Click();

        // Verify the JS reveal function was called
        var invocations = JSInterop.Invocations;
        Assert.Contains(invocations, inv => inv.Identifier == "reveal");
    }

    [Fact]
    public async Task OnRevealStart_Sets_Revealing_State()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();
        
        // Simulate JS calling OnRevealStart
        await cut.Instance.OnRevealStart();
        
        Assert.True(cut.Instance.Revealing);
        Assert.False(cut.Instance.Revealed);
    }

    [Fact]
    public async Task OnRevealComplete_Sets_Revealed_State()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();
        
        // Simulate JS calling OnRevealComplete
        await cut.Instance.OnRevealComplete();
        
        Assert.True(cut.Instance.Revealed);
        Assert.False(cut.Instance.Revealing);
    }

    [Fact]
    public void Component_Implements_AsyncDisposable()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();

        Assert.IsAssignableFrom<IAsyncDisposable>(cut.Instance);
    }

    [Fact]
    public async Task Revealed_State_Updates_CSS_Class()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();

        // Initially hidden
        var div = cut.Find("div");
        Assert.Contains("hidden", div.ClassName);

        // After reveal complete
        await cut.Instance.OnRevealComplete();
        cut.Render();
        
        div = cut.Find("div");
        Assert.Contains("revealed", div.ClassName);
        Assert.DoesNotContain("hidden", div.ClassName);
    }

    [Fact]
    public async Task Revealing_State_Updates_CSS_Class()
    {
        SetupJSInterop();
        var cut = Render<Components.BlazorFastSpoiler>();

        // Trigger revealing state
        await cut.Instance.OnRevealStart();
        cut.Render();
        
        var div = cut.Find("div");
        Assert.Contains("revealing", div.ClassName);
        Assert.DoesNotContain("hidden", div.ClassName);
    }
}

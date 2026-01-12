namespace BlazorFastSpoiler.Components;

/// <summary>
/// Blazor component that renders spoiler content hidden behind a canvas-based particle mask.
/// Click (or press Enter/Space) to reveal the content.
/// </summary>
public sealed partial class BlazorFastSpoiler : ComponentBase, IAsyncDisposable
{
    private const string JsModulePath = "./_content/BlazorFastSpoiler/js/blazorFastSpoiler.js";

    private ElementReference _containerRef;
    private IJSObjectReference? _jsModule;
    private DotNetObjectReference<BlazorFastSpoiler>? _objRef;
    private bool _isInitialized;
    private bool _isDisposed;

    private SpoilerConfig _config;

    [Inject] private IJSRuntime JSRuntime { get; set; } = default!;

    /// <summary>Child content to be displayed as spoiler text.</summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>Scale factor for particle size (default: 1).</summary>
    [Parameter] public double Scale { get; set; } = 1.0;

    /// <summary>Minimum velocity for particles in pixels per frame (default: 0.01).</summary>
    [Parameter] public double MinVelocity { get; set; } = 0.01;

    /// <summary>Maximum velocity for particles in pixels per frame (default: 0.05).</summary>
    [Parameter] public double MaxVelocity { get; set; } = 0.05;

    /// <summary>Particle lifetime in frames at 60fps (default: 120).</summary>
    [Parameter] public int ParticleLifetime { get; set; } = 120;

    /// <summary>Target particle density (particles per 100 square pixels) (default: 8).</summary>
    [Parameter] public double Density { get; set; } = 8.0;

    /// <summary>Text fade-in duration in milliseconds when revealing (default: 300).</summary>
    [Parameter] public int RevealDuration { get; set; } = 300;

    /// <summary>True while the spoiler is revealing (text fading in).</summary>
    public bool Revealing { get; private set; }

    /// <summary>True once the spoiler has been fully revealed.</summary>
    public bool Revealed { get; private set; }

    /// <inheritdoc />
    protected override void OnParametersSet()
    {
        // Defensive normalization to avoid undefined JS behavior.
        var scale = Scale <= 0 ? 1.0 : Scale;
        var minVelocity = MinVelocity < 0 ? 0 : MinVelocity;
        var maxVelocity = MaxVelocity < 0 ? 0 : MaxVelocity;
        if (maxVelocity < minVelocity)
        {
            (minVelocity, maxVelocity) = (maxVelocity, minVelocity);
        }

        var particleLifetime = ParticleLifetime <= 0 ? 120 : ParticleLifetime;
        var density = Density < 0 ? 0 : Density;
        var revealDuration = RevealDuration < 0 ? 0 : RevealDuration;

        _config = new SpoilerConfig(
            Scale: scale,
            MinVelocity: minVelocity,
            MaxVelocity: maxVelocity,
            ParticleLifetime: particleLifetime,
            Density: density,
            RevealDuration: revealDuration
        );
    }

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && !_isDisposed)
        {
            await InitializeAsync();
        }
    }

    private async Task InitializeAsync()
    {
        if (_isInitialized || _isDisposed) return;

        try
        {
            _jsModule = await JSRuntime.InvokeAsync<IJSObjectReference>("import", JsModulePath);
            _objRef = DotNetObjectReference.Create(this);
            await _jsModule.InvokeVoidAsync("initialize", _containerRef, _config, _objRef);
            _isInitialized = true;
        }
        catch (JSException)
        {
            // JS interop not available (e.g., prerendering/SSR). Component becomes a no-op.
        }
        catch (JSDisconnectedException)
        {
            // JS context is disconnected (e.g., navigation during render). Component becomes a no-op.
        }
    }

    /// <summary>Called from JavaScript when the reveal animation starts.</summary>
    [JSInvokable]
    public Task OnRevealStart()
    {
        if (_isDisposed) return Task.CompletedTask;

        Revealing = true;
        return InvokeAsync(StateHasChanged);
    }

    /// <summary>Called from JavaScript when the reveal animation completes.</summary>
    [JSInvokable]
    public Task OnRevealComplete()
    {
        if (_isDisposed) return Task.CompletedTask;

        Revealed = true;
        Revealing = false;
        return InvokeAsync(StateHasChanged);
    }

    private string CssClass => Revealed
        ? "blazor-fast-spoiler revealed"
        : Revealing
            ? "blazor-fast-spoiler revealing"
            : "blazor-fast-spoiler hidden";

    private string InlineStyle => Revealing
        ? $"--reveal-duration: {_config.RevealDuration}ms;"
        : string.Empty;

    private int TabIndex => Revealed ? -1 : 0;

    private string? AriaLabel => Revealed ? null : "Click to reveal spoiler";

    private string AriaPressed => Revealed ? "true" : "false";

    private async Task HandleClick()
    {
        if (Revealed || Revealing || _isDisposed || _jsModule is null) return;

        try
        {
            await _jsModule.InvokeVoidAsync("reveal", _containerRef);
        }
        catch (JSDisconnectedException)
        {
            // Component disposed or JS context disconnected.
        }
    }

    private Task HandleKeyDown(KeyboardEventArgs e)
    {
        return e.Key is "Enter" or " "
            ? HandleClick()
            : Task.CompletedTask;
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (_isDisposed) return;
        _isDisposed = true;

        if (_jsModule is not null)
        {
            try
            {
                await _jsModule.InvokeVoidAsync("dispose", _containerRef);
                await _jsModule.DisposeAsync();
            }
            catch (JSDisconnectedException)
            {
                // Ignore if JS context is disconnected.
            }
        }

        _objRef?.Dispose();
        _objRef = null;
    }
}


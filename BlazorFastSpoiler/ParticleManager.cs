namespace BlazorFastSpoiler;

/// <summary>
/// Manages particle state and calculations in C# for optimal performance
/// </summary>
internal sealed class ParticleManager
{
    private readonly ParticleConfig _config;
    private readonly List<Particle> _particles = [];
    private readonly Random _random = new();
    private bool _spawningEnabled = true;
    private double _width;
    private double _height;

    private static readonly ParticleSize[] ParticleSizes =
    [
        new(1, 1),
        new(1, 2),
        new(2, 1),
        new(2, 2)
    ];

    public ParticleManager(ParticleConfig config, double width, double height)
    {
        _config = config;
        _width = width;
        _height = height;
        InitializeParticles();
    }

    public void UpdateDimensions(double width, double height)
    {
        _width = width;
        _height = height;
    }

    private void InitializeParticles()
    {
        var area = _width * _height;
        var targetCount = (int)Math.Ceiling((area / 100) * _config.Density);
        var initialCount = (int)Math.Ceiling(targetCount * 0.5);

        for (var i = 0; i < initialCount; i++)
        {
            var particle = CreateParticle();
            particle.Life = _random.NextDouble() * particle.MaxLife;
            _particles.Add(particle);
        }
    }

    private Particle CreateParticle()
    {
        var sizeTemplate = ParticleSizes[_random.Next(ParticleSizes.Length)];
        var scaledSize = _config.Scale;
        var particleWidth = sizeTemplate.Width * scaledSize;
        var particleHeight = sizeTemplate.Height * scaledSize;

        const double padding = 2;
        var maxX = _width - particleWidth - padding;
        var maxY = _height - particleHeight - padding;
        var x = padding + _random.NextDouble() * Math.Max(0, maxX - padding);
        var y = padding + _random.NextDouble() * Math.Max(0, maxY - padding);

        var speed = _random.NextDouble() * (_config.MaxVelocity - _config.MinVelocity) + _config.MinVelocity;
        var angle = _random.NextDouble() * Math.PI * 2;
        var vx = Math.Cos(angle) * speed;
        var vy = Math.Sin(angle) * speed;

        const double lifetimeVariation = 0.5;
        var minLifetime = _config.ParticleLifetime * (1 - lifetimeVariation);
        var maxLifetime = _config.ParticleLifetime * (1 + lifetimeVariation);
        var lifetime = _random.NextDouble() * (maxLifetime - minLifetime) + minLifetime;

        var maxAlpha = _random.NextDouble() < 0.5 ? 1.0 : 0.3 + _random.NextDouble() * 0.3;

        return new Particle
        {
            X = x,
            Y = y,
            Vx = vx,
            Vy = vy,
            Width = particleWidth,
            Height = particleHeight,
            Life = lifetime,
            MaxLife = lifetime,
            Alpha = 0,
            MaxAlpha = maxAlpha
        };
    }

    public void Update()
    {
        var area = _width * _height;
        var targetCount = (int)Math.Ceiling((area / 100) * _config.Density);

        // Update existing particles
        for (var i = _particles.Count - 1; i >= 0; i--)
        {
            var p = _particles[i];

            // Update position first
            p.X += p.Vx;
            p.Y += p.Vy;

            // Update lifetime
            p.Life--;

            // Calculate alpha based on life stage for smooth fade in/out
            // 20% of lifetime for fade in, 20% for fade out
            var fadeInDuration = p.MaxLife * 0.2;
            var fadeOutDuration = p.MaxLife * 0.2;

            if (p.Life > p.MaxLife - fadeInDuration)
            {
                // Fade in
                var fadeProgress = (p.MaxLife - p.Life) / fadeInDuration;
                p.Alpha = fadeProgress * p.MaxAlpha;
            }
            else if (p.Life < fadeOutDuration)
            {
                // Fade out
                var fadeProgress = p.Life / fadeOutDuration;
                p.Alpha = fadeProgress * p.MaxAlpha;
            }
            else
            {
                // Full opacity (respecting maxAlpha)
                p.Alpha = p.MaxAlpha;
            }

            // Remove particles that are dead or way out of bounds
            var margin = Math.Max(_width, _height) * 0.5;
            var outOfBounds =
                p.X < -margin ||
                p.X > _width + margin ||
                p.Y < -margin ||
                p.Y > _height + margin;

            if (p.Life <= 0 || outOfBounds)
            {
                _particles.RemoveAt(i);
            }
        }

        // Spawn new particles to maintain density (only if spawning is enabled)
        if (_spawningEnabled)
        {
            while (_particles.Count < targetCount)
            {
                _particles.Add(CreateParticle());
            }
        }
    }

    public IReadOnlyList<Particle> GetParticles() => _particles;

    public bool HasParticles() => _particles.Count > 0;

    public void StopSpawning() => _spawningEnabled = false;
}

internal sealed record ParticleSize(double Width, double Height);

internal sealed class Particle
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Vx { get; set; }
    public double Vy { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Life { get; set; }
    public double MaxLife { get; set; }
    public double Alpha { get; set; }
    public double MaxAlpha { get; set; }
}

internal sealed record ParticleConfig(
    double Scale,
    double MinVelocity,
    double MaxVelocity,
    int ParticleLifetime,
    double Density,
    string TextColor);

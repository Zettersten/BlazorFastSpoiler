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
            p.Life--;
            p.Alpha = Math.Min(p.MaxAlpha, (p.Life / p.MaxLife) * p.MaxAlpha);

            if (p.Life <= 0)
            {
                _particles.RemoveAt(i);
                continue;
            }

            p.X += p.Vx;
            p.Y += p.Vy;

            // Bounce off edges
            if (p.X <= 0 || p.X + p.Width >= _width) p.Vx *= -1;
            if (p.Y <= 0 || p.Y + p.Height >= _height) p.Vy *= -1;

            p.X = Math.Max(0, Math.Min(_width - p.Width, p.X));
            p.Y = Math.Max(0, Math.Min(_height - p.Height, p.Y));
        }

        // Spawn new particles if enabled
        if (_spawningEnabled && _particles.Count < targetCount)
        {
            var spawnCount = Math.Min(2, targetCount - _particles.Count);
            for (var i = 0; i < spawnCount; i++)
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

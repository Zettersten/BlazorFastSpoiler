namespace BlazorFastSpoiler.Components;

internal readonly record struct SpoilerConfig(
    double Scale,
    double MinVelocity,
    double MaxVelocity,
    int ParticleLifetime,
    double Density,
    int RevealDuration
);


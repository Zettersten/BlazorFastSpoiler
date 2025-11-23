namespace BlazorFastSpoiler;

/// <summary>
/// Represents a bounding box for text measurement
/// </summary>
internal sealed record BoundingBox(
    double X,
    double Y,
    double Width,
    double Height);

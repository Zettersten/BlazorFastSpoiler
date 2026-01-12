# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-01-12
### Changed
- Upgraded NuGet dependencies to latest patch/minor versions (including .NET 10.0.1 packages).
- Refactored the component into a code-behind implementation with a typed JS config model.
- Removed CSP-unsafe `eval` usage from the demo (Prism highlighting is now invoked via a named JS function).
- Removed unused demo pages and unused bundled Bootstrap assets.


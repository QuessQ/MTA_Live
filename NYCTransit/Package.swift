// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "NYCTransit",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "NYCTransit",
            targets: ["NYCTransit"]
        ),
    ],
    dependencies: [
        // MTA GTFS-RT feed parsing
        .package(url: "https://github.com/apple/swift-protobuf.git", from: "1.25.0"),
    ],
    targets: [
        .target(
            name: "NYCTransit",
            dependencies: [
                .product(name: "SwiftProtobuf", package: "swift-protobuf"),
            ],
            path: "NYCTransit"
        ),
        .testTarget(
            name: "NYCTransitTests",
            dependencies: ["NYCTransit"],
            path: "NYCTransitTests"
        ),
    ]
)

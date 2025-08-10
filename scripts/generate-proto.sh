#!/bin/bash

# Create output directory
mkdir -p src/generated

# Generate TypeScript bindings using ts-proto
npx protoc \
  --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=src/generated \
  --ts_proto_opt=outputServices=grpc-web,env=browser,useExactTypes=false \
  --proto_path=proto \
  proto/sushi_rpc.proto \
  proto/api_version.proto

echo "Proto files generated successfully!"

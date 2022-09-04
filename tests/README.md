# Tests

This section contains various tests for units (splitted in client and server) and e2e. When Mocks are needed, they are created in the corresponding folder in the tests environment. The runtime environment will then search at first in its own environment and then in the tests environment. The convention to name something without conflicting names is to add a `Test` in front of the files name. For example `TestMyTestModel.ts`.

## TypeScript expect error codes

To avoid writing the same expecting error description again and again, we use number codes to describe those expected errors once in this file and the we write only the code.

### Example

```TypeScript
// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className: "MyTestModel", collectionName: "MyTestModels", isAbstract: false }) })
export default class TestMyTestModel extends BaseModel { }
```

### Error codes
- 001: because we are using mocks here, we have to pass a normally unaccessible property

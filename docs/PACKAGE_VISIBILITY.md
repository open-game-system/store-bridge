# Setting GitHub Package Visibility to Public

For GitHub Packages to be publicly accessible, you need to explicitly set them to public. Here's how to do it:

## Setting Package Visibility in GitHub UI

1. Go to your GitHub repository page
2. Click on the "Packages" tab
3. Click on your package (`@open-game-system/store-bridge`)
4. On the right side, click "Package settings"
5. Scroll to the bottom to the "Danger Zone" section
6. Click "Change visibility"
7. Select "Public"
8. Confirm by typing the package name and clicking the confirmation button

## Verify Package Access

After setting the package to public, anyone should be able to install it with:

```bash
# Create .npmrc in project directory
echo "@open-game-system:registry=https://npm.pkg.github.com" > .npmrc

# Install the package
npm install @open-game-system/store-bridge
```

No authentication should be required for public packages.

## If Package Is Still Not Accessible

If the package is still not accessible after setting it to public:

1. Check if the package has inheritance settings enabled that might override your visibility settings
2. Ensure the repository linked to the package is also public
3. Verify the package was published with the `--access public` flag

You can also try publishing a new version with the `publishConfig` section in package.json explicitly set to:

```json
"publishConfig": {
  "access": "public"
}
```

## Republish If Needed

If all else fails, you may need to delete and republish the package with the correct visibility settings. 
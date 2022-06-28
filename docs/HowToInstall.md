# How to install
Thanks to [@peter-evans](https://github.com/peter-evans)



1. Download the latest stable release of the Swagger UI [https://github.com/swagger-api/swagger-ui/releases].

2. Extract the contents and copy the "dist" directory to the root of your repository.

3. Move the file "index.html" from the directory "dist" to the root of your repository.

4. Correct all file paths in the `index.html` to `./dist/......` (and change title to something you like)

5. Change the url in `./dist/swagger-initializer.js` to `main.json`

6. Replace `SwaggerUIStandalonePreset` with `SwaggerUIStandalonePreset.slice(1)` to remove the top bar

# Building the site

Right now, the site is built manually by querying the GitHub API for issues with one of the [vendor labels](https://github.com/mozilla/platform-tilt/issues?q=is%3Aissue+is%3Aopen+label%3A%22vendor%3A+apple%22%2C%22vendor%3A+google%22%2C%22vendor%3A+microsoft%22). To do this, you must:

* Check out the `gh-pages` branch
* Create a GitHub API token and put it in your environment, or in a `.env` file at the root of the project as `GITHUB_DEV_API_TOKEN=token`.
* [Install Deno](https://docs.deno.com/runtime/manual)
* Run `deno run -A build.jsx`

This will overwrite the contents of index.html, and pushing that back to `gh-pages` will update https://mozilla.github.io/platform-tilt/.
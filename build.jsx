// Install Deno (https://deno.com/)
// deno run -A build.jsx

/** @jsxImportSource https://esm.sh/preact */
import { render } from "https://esm.sh/preact-render-to-string@6.3.1";
import prettier from "npm:prettier@3.2.4";

import { loadSync } from "https://deno.land/std@0.212.0/dotenv/mod.ts";
const { GITHUB_DEV_API_TOKEN } = loadSync();

import markdownit from "https://esm.sh/markdown-it@14.0.0";
const md = markdownit();

import { Octokit } from "https://esm.sh/@octokit/rest@20.0.2";
const octokit = new Octokit({
  auth: GITHUB_DEV_API_TOKEN,
});

function pageHTML(children) {
  const html = prettier.format(
    `<!DOCTYPE html>${render(
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Platform Tilt - Mozilla</title>
          <meta name="description" content="Platform Tilt tracks technical issues in major software platforms which disadvantage Firefox relative to the first-party browser." />
          <link rel="stylesheet" href="static/page.css" />
        </head>
        <body>
          <div class="container">
            <div class="jumbotron">
              <div style="position: absolute; top: 0;">
                <img
                  src="./static/Mozilla.svg"
                  style="height: 32px"
                  alt="Mozilla"
                />{" "}
              </div>
              <h1>Platform Tilt</h1>
              <p>
                This dashboard tracks technical issues in major software
                platforms which disadvantage Firefox relative to the first-party
                browser. We consider aspects like security, stability,
                performance, and functionality, and propose changes to create a
                more level playing field.
              </p>
              <p>
                Further discussion on the live issues can be found in our <a href="https://github.com/mozilla/platform-tilt/">
                  platform-tilt issue tracker
                </a>
                .
              </p>
            </div>

            <div class="col-sm-12">{children}</div>

            <div class="clearfix"></div>
          </div>
          <script
            dangerouslySetInnerHTML={{
              __html: `
    function expandAll(table) {
      [...table.querySelectorAll("details")].forEach((details) => details.open = true);
    }
    function openTarget() {
      let hash = location.hash.substring(1);
      let element;
      if (hash) element = document.getElementById(hash);
      if (!element) {
        return;
      }
      //if (hash.startsWith('issues_')) {
      //  [...element.closest("table").querySelectorAll("details")].forEach((details) => details.open = true);
      //  return;
      //}
      if (element && element.tagName.toLowerCase() === 'details') element.open = true;
    }
    window.addEventListener('hashchange', openTarget);
    openTarget();
                  `,
            }}
          ></script>
        </body>
      </html>
    )}`,
    { parser: "html" }
  );
  return html;
}

async function getIssuesForLabel(vendor) {
  let label = `vendor: ${vendor}`;
  let issues = await octokit.paginate("GET /repos/{owner}/{repo}/issues", {
    owner: "mozilla",
    repo: "platform-tilt",
    labels: label,
  });
  issues = issues.reverse().map((issue) => {
    let body = md.render(issue.body);
    if (body.indexOf("img") !== -1) {
      // Images come through encoded:
      body = body.replace(/&lt;img.*?&gt;/g, (match) => {
        let src = match.match(/src=&quot;(.*?)&quot;/)?.[1];
        if (!src) {
          return match;
        }
        let width = match.match(/width=&quot;(.*?)&quot;/)?.[1];
        if (!width) {
          return `<img src="${src}">`;
        }
        return `<img src="${src}" width="${width}">`;
      });
    }
    return {
      number: issue.number,
      html_url: issue.html_url,
      title: issue.title,
      state: issue.state,
      body,
      labels: issue.labels.map((label) => label.name),
      comments_url: issue.comments_url,
    };
  });

  return {
    search_label: label,
    search_vendor: vendor,
    issues,
  };
}

const allIssues = [
  await getIssuesForLabel("apple"),
  await getIssuesForLabel("google"),
  await getIssuesForLabel("microsoft"),
];

for (const issues of allIssues) {
  if (issues.issues.length === 0) {
    throw new Error("No issues found");
  }
  console.log(issues.search_vendor, issues.issues.length);
}

Deno.writeTextFileSync(
  "index.html",
  await pageHTML(
    <>
      {allIssues.map((issues) => (
        <IssueTable issues={issues} />
      ))}
    </>
  )
);

function IssueTable({ issues }) {
  return (
    <table id={`issues_${issues.search_vendor}`}>
      <caption>
        Vendor:{" "}
        <b style="text-transform: capitalize;">{issues.search_vendor}</b>
        <button onclick={`expandAll(document.getElementById("issues_${issues.search_vendor}"))`}>Expand all</button>
      </caption>
      <thead>
        <tr>
          <th>Issue</th>
          <th class="state">Status</th>
        </tr>
      </thead>
      <tbody>
        {issues.issues.map((issue) => (
          <tr>
            <td class="title">
              <details id={`issue_${issue.number}`}>
                <summary>
                  <a href={issue.html_url}>{issue.title}</a>
                  <a
                    class="internal-link"
                    href={`#issue_${issue.number}`}
                    title="Permalink to this issue"
                  >
                    #
                  </a>
                  {/* <a
                    href={issue.html_url}
                    title={`External link to issue ${issue.number} on GitHub}`}
                  >
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="icon icon-tabler icon-tabler-external-link"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="#2c3e50"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
                        <path d="M11 13l9 -9" />
                        <path d="M15 4h5v5" />
                      </svg>
                    </span>
                  </a> */}
                </summary>
                <div
                  class="issue-body"
                  dangerouslySetInnerHTML={{ __html: issue.body }}
                ></div>
              </details>
            </td>
            <td class="state">{issue.state}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

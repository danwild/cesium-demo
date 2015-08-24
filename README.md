# cesium-demo
Repo for experimenting with CesiumJS functionality, and learning some JS build/dependency management tools.

<h2>Get started</h2>

<p>Install npm dependencies:</p>
`npm install`

<p>Install bower dependencies:</p>
`bower install`

<p>Build:</p>
`gulp`


<h2>Gulp Stuff</h2>

<ul>
	<li>Injects script and stylesheet tags into `index.html` for bower dependencies.</li>
	<li>Combines and uglifies js and css for angular components</li>
</ul>

<p><strong>Gulp TODO:</strong></p>

<ul>
	<li>Get some SCSS || LESS happening, watch and compile</li>
	<li>...</li>
</ul>


<h2>Notes:</h2>

<ul>
	<li>Had issues with gulp using bootstrap 3.3.5 (main file/s not set correctly for css for bower), have rolled back to 3.3.4.</li>
	<li>Did try combining all js assets into one file to be minified, but tended to cause conflicts so sticking with uglier but more reliable inject script tag method.</li>
</ul>
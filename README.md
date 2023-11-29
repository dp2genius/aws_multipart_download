# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Downloader
```typescript
class Downloader {}

interface DownloadOptions {
  /**
   * maximum connections the downloader can use in parallel
   */
	connections?: number;
  // ...
}

const downloader = new Downloader(downloadOptions);

// Actions
/**
 * Add url to downloader and (optionally?) start download immediately
 * @params url: string;
 */
downloader.download(url: string);

/**
  * Pause a certain download
  */
downloader.pause(url: string);

/**
  * Pause all downloads
  */
downloader.pauseAll();

/**
  * Resume a paused download
  */
downloader.resume();
downloader.resumeAll();

/**
 * Abort a download and drop its data
 */
downloader.abort(url: string);
downloader.abortAll(url: string);

/**
 * Abort all downloads, drop all downloaded data,
 * reset the state of downloader
 */
downloader.reset();

// Events
/**
 * emit when download progress changes
 * @params url: string
 * @params progress: number within [0, 1], indicates download progress
 */
downloader.on('progress', (url: string; progress: number; ... ) => void);

/**
 * emit when download fails
 * @params url: string
 * @params reason: Error
 */
downloader.on('error', (url: string; reason: unknown) => void);

/**
 * emit when download completes
 * @params url: string
 * @params reason: Error
 */
downloader.on('complete', (url: string) => void);

/**
 * Stop to listen to a certain event
 */
downloader.off(eventName: string; callback: (...) => unknown)
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

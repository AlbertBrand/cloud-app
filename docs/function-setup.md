# Function setup

```
yarn global add firebase-tools
firebase login
```

Under project:
```
firebase init functions
```

Make sure to switch to project
```
firebase use albert-brand-speeltuin
```

Deploy:
(make sure to run in root of project)
```
firebase deploy --only functions:detectLabels
```


Some examples from Google:
https://github.com/firebase/functions-samples

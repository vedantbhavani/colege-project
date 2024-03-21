const express = require("express");
const ConnectDB = require("./db/connection");
const app = express();
const expressSession = require('express-session');
const passport = require("passport");
const port = process.env.PORT || 5000;
const register = require('./auth/auth');
const { PassInit, isAuthenticted, isAdmin } = require('./auth/passportConf');
const fs = require('fs');
const path = require('path');
const { upload } = require('./middleware/imageHandler');
const File = require('./models/file');
require('dotenv').config();
const Langauage = require('./models/Langauage');
const bodyParser = require('body-parser');
const VideoContent = require('./models/videoContent');
const TextContent = require('./models/textContent');
const DocContent = require('./models/docContent');
const User = require("./models/user");
const cors = require('cors');

PassInit(passport);
app.use(cors());
// Middlwere Usages 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(expressSession({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// Enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set('views', __dirname + '/views');

//Server Initial Setup 
ConnectDB();
app.listen(port, () => {
    console.log(`website is runnig at : http://localhost:${port}`);
});

// Get Request Handeling 
app.get("/", (req, res) => {
    res.render("main");
});

app.get("/index", (req, res) => {
    res.status(200).render("index");
});
app.get("/register", (req, res) => {
    res.status(200).render("register");
});
app.get("/login", (req, res) => {
    res.status(200).render("login");
});
app.get('/grow-web', isAuthenticted, (req, res) => {
    res.status(200).render("grow-web");
})
app.get('/top-languages', isAuthenticted, (req, res) => {
    res.status(200).render("top-languages");
})
app.get('/users', isAuthenticted, (req, res) => {
    res.status(200).render("users");
})
app.get('/feedback', isAuthenticted, (req, res) => {
    res.status(200).render("feedback");
})
app.get("/about", (req, res) => {
    res.status(200).render("about");
})
app.get("/admin", isAdmin, (req, res) => {
    res.status(200).render("admin");
})
app.get("/contact", (req, res) => {
    res.status(200).render("contact");
})
app.get('/secret', isAuthenticted, (req, res) => {
    res.render('secret');
})
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});
app.get('/miniProjects', (req, res) => {
    res.render('index');
})

app.get('/language', isAuthenticted, (req, res) => {
    res.status(200).render('language');
})

app.get('/photos', async (req, res) => {
    const imgs = await File.find({}).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).render('photos', { imgs: data })
    })
})


app.get('/get-img', async (req, res) => {
    const imgs = await File.find({}).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
})


// Post Requests Handeling

app.post('/data/img', upload.single('avatar'), async (req, res) => {
    const obj = {
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    }
    await File.create(obj).then((data) => {
        res.status(200).json(data);
    }
    ).catch((err) => {
        res.status(400).json({ message: "Error" });
    }
    )
});
app.post('/api/register', register);
app.post('/api/login', passport.authenticate('local'), (req, res) => {
    if (req.user.role == 'admin') {
        res.redirect('/admin');
        return;
    }
    res.redirect('/language');

});




//Admin Panel API

app.get('/admin/panel/users/get', async (req, res) => {
    const users = await User.find({}).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
})


app.get('/admin/panel/users/delete/:id', async (req, res) => {
    const id = req.params.id;
    await User.findByIdAndDelete(id).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
})

app.get('/admin/panel/users/update/:id', async (req, res) => {

    const id = req.params.id;
    const user = await User.findById(id).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
})

app.get('/admin/langauage/get', async (req, res) => {
    const lang = await Langauage.find({}).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).json(data);
    })
})

app.post('/admin/langauage/get/all', async (req, res) => {
    const id = req.body.id;
    const VideoC = await VideoContent.find({ language: id })
    const TextC = await TextContent.find({ language: id })
    const DocC = await DocContent.find({ language: id })
    const data = {
        VideoC, TextC, DocC
    }

    res.status(200).json(data)

})
app.get('/admin/langauage/get/:id', async (req, res) => {
    const id = req.params.id;

    const lang = await Langauage.findById(id).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
})

app.post('/admin/langauage/update', async (req, res) => {

    const { id, NewVideoEmbed, NewLanguageText, NewLanguageName, NewLangauageDoc } = req.body;
    const _id = id;
    await Langauage.findByIdAndUpdate(_id, { VideoEmbed: NewVideoEmbed, LanguageText: NewLanguageText, LanguageName: NewLanguageName, LangauageDoc: NewLangauageDoc }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).redirect('/admin');
    })


})

app.post('/admin/langauage/delete', async (req, res) => {
    const { id } = req.body.id;
    const _id = id;
    const lang = await Langauage.deleteOne(_id)
    await VideoContent.deleteOne({ language: id });
    await TextContent.deleteOne({ language: id });
    await DocContent.deleteOne({ language: id });
    res.status(200).redirect('/admin');
})


app.post('/admin/langauage/create', async (req, res) => {

    const { LanguageName } = req.body;
    if (!LanguageName) {
        return res.status(400).json({ message: "Please fill all the fields" });
    }

    const lang = await Langauage.create(req.body)
    VideoContent.create({ language: lang._id, video: [] });
    TextContent.create({ language: lang._id, text: 'text' });
    DocContent.create({ language: lang._id, doc: [] });

    res.status(200).redirect('/admin');


})



// Language APIs 


// Video Content APIs


app.post('/language/videos/get', async (req, res) => {
    const { id } = req.body;
    const lang = await VideoContent.findOne({ language: id }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
}
)

app.post('/language/videos/update', async (req, res) => {
    const { id, video } = req.body;
    const lang = await VideoContent.findOneAndUpdate({ language: id }, { video: video }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).redirect('/admin');
    })
})

app.post('/language/videos/create', async (req, res) => {
    const { id, video } = req.body;

    const vid = await VideoContent.findOne({ language: id })
    vid.video.push(video);
    vid.save();
    res.status(200).redirect('/admin');
})

app.post('/language/videos/delete', async (req, res) => {
    const { id } = req.body;
    const lang = await VideoContent.deleteOne({ language: id }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).redirect('/admin');
    })
})

// Text Content APIs

app.post('/language/text/get', async (req, res) => {
    const { id } = req.body;
    const lang = await TextContent.findOne({ language: id }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
})

app.post('/language/text/update', async (req, res) => {
    const { id, text } = req.body;
    const lang = await TextContent.findOneAndUpdate({ language: id }, { text: text }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).redirect('/admin');
    }
    )
})

app.post('/language/text/create', async (req, res) => {
    const { id, text } = req.body;

    const lang = await TextContent.findOne({ language: id })
    lang.text = text;
    lang.save();
    res.status(200).redirect('/admin');

})

app.post('/language/text/delete', async (req, res) => {
    const { id } = req.body;
    const lang = await TextContent.deleteOne({ language: id }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).redirect('/admin');
    })
})

// Doc Content APIs

app.post('/language/doc/get', async (req, res) => {
    const { id } = req.body;
    const lang = await DocContent.findOne({ language: id }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).send(data);
    })
})

app.post('/language/doc/update', async (req, res) => {
    const { id, doc } = req.body;

    const lang = await DocContent.findOneAndUpdate({ language: id }, { doc: doc }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).redirect('/admin');
    })
})

app.post('/language/doc/create', async (req, res) => {
    const { id, docLink } = req.body;
    const dc = await DocContent.findOne({ language: id })
    dc.doc.push(docLink);
    dc.save();
    res.status(200).redirect('/admin');

})

app.post('/language/doc/delete', async (req, res) => {
    const { id } = req.body;
    const lang = await DocContent.deleteOne({ language: id }).then((data, err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).redirect('/admin');
    })
})



// USER Profile API

app.get('/whoami', isAuthenticted, (req, res) => {
    const user = req.user;
    res.status(200).json(user);
});

app.get('/profile', isAuthenticted, (req, res) => {
    res.status(200).render('profile')
})

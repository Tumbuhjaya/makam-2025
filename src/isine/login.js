var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var axios = require('axios')
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , flash = require("connect-flash")
  , sha1 = require('sha1');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(cookieParser());
router.use(session({ 
    secret: '***REMOVED***',   // SARAN: pindahkan ke environment variable
    cookie: { maxAge: 1200000 },
    saveUninitialized: true,
    resave: true 
}));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

// middleware time log
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

// ========== Local Strategy ==========
passport.use(new LocalStrategy({
    passReqToCallback: true
},
function(req, username, password, done) {
    // PERBAIKAN: parameterized query
    const sql = "SELECT * from user u left join master_makam mm on mm.id = u.master_makam_id WHERE u.username = ?";
    connection.query(sql, [username], function(err, rows, fields) {
        if (err) {
            // handle error dengan baik (jangan throw di production)
            return done(err);
        }
        if (rows.length > 0) {
            rows[0].tujuan = req.body.tujuan;
            if (rows[0].pwd != sha1(password)) {
                return done(null, false, req.flash('pesan', 'Password salah'), req.flash('tujuan', req.body.tujuan));
            } else {
                return done(null, rows);
            }
        } else {
            return done(null, false, req.flash('pesan', 'Username tidak ditemukan'), req.flash('tujuan', req.body.tujuan));
        }
    });
}));

// ========== Google Strategy ==========
passport.use(new GoogleStrategy({
    clientID: "1017151440022-7jkuiqa8t0eqpebbl85nktugmh8rqpvm.apps.googleusercontent.com",  // SARAN: pindahkan ke .env
    clientSecret: "***REMOVED***",                                             // SARAN: pindahkan ke .env
    callbackURL: "http://singmantap.jeparakab.go.id/autentifikasi/auth/google/callback"   // SARAN: pindahkan ke .env
},
function(accessToken, refreshToken, profile, done) {
    // PERBAIKAN: parameterized query
    const selectSql = "SELECT * from user WHERE email = ? and google = '1'";
    connection.query(selectSql, [profile.emails[0].value], function(err, rows, fields) {
        if (err) {
            return done(err);
        }
        if (rows.length > 0) {
            return done(null, rows);
        } else {
            // insert user baru
            const insertSql = "INSERT INTO user (id_google, fullname, google, foto, email) VALUES (?, ?, '1', ?, ?)";
            connection.query(insertSql, [
                profile.id,
                profile.displayName,
                profile.photos[0].value,
                profile.emails[0].value
            ], function(err, result) {
                if (err) {
                    return done(err);
                }
                // ambil kembali data user yang baru disimpan
                connection.query(selectSql, [profile.emails[0].value], function(err, newRows) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, newRows);
                });
            });
        }
    });
}));

// ========== Serialize / Deserialize ==========
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

// ========== Routes ==========
router.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
        res.redirect("/izin_pemanfaatan_ruang");
    }
);

router.get('/', function(req, res) {
    var tujuan = req.flash('tujuan');
    var pesan = req.flash('pesan');
    var menuju = "/backoffice";
    if (tujuan != "") {
        menuju = tujuan;
    } else if (req.query.tujuan != undefined) {
        menuju = req.query.tujuan;
    }
    res.render('login', { pesan: pesan, tujuan: menuju });
});

router.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/autentifikasi',
        failureFlash: true
    }),
    function(req, res) {
        res.redirect(req.user[0].tujuan);
    }
);

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/autentifikasi');
});

router.get('/logout_google', function(req, res) {
    req.logout();
    res.redirect('https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://singmantap.jeparakab.go.id');
});

// ========== Ekspor ==========
module.exports.router = router;

module.exports.cek_login = async function(req, res, next) {
    let status = false;
    if (req.query.token || req.session.token) {
        let a = '';
        if (!req.session.token) {
            req.session.token = req.query.token;
            a = req.query.token;
        } else {
            a = req.session.token;
        }
        await axios.get('https://eksekutif.semarangkota.go.id/api/user/get_user?token=' + a)
            .then(function(response) {
                status = response.data.status;
                req.user = [{ is_admin: 9999 }];
            })
            .catch(function(error) {
                status = false;
            });
    }
    if ((req.query.token || req.session.token) && (status == true)) {
        next();
    } else if (req.isAuthenticated() && req.user[0].google != 1) {
        next();
    } else {
        res.redirect('/autentifikasi?tujuan=' + encodeURIComponent(req.originalUrl));
    }
};

module.exports.cek_login_google = function(req, res, next) {
    if (req.isAuthenticated() && req.user[0].google != 0) {
        next();
    } else {
        res.redirect('/autentifikasi/auth/google?tujuan=' + encodeURIComponent(req.originalUrl));
    }
};
const Joi = require('joi')

module.exports = {
    // To check enc property in payload
    getEnc: (data) => {
        const schema = Joi.object({
            enc: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To register new user
    registerUser: (data) => {
        const schema = Joi.object({
            // userName: Joi.string().pattern(/^[a-z0-9]+$/).min(3).max(25).required().messages({
            //     'string.pattern.base': "Username Should Not Contain Special Characters",
            // }),
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            }),
            password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|\-=])/).min(8).max(25).required().messages({
                'string.pattern.base': 'Password Should Contain At Least 1 Capital Letter, 1 Small Letter, 1 Number And 1 Special Character',
            }),
            referralId: Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(7).max(30).optional().allow('')
        })

        return schema.validate(data)
    },

    // To verify otp
    verifyOtp: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            }),
            otp: Joi.string().pattern(/^[0-9]+$/).length(6).required().allow('').messages({
                'string.pattern.base': 'OTP Should Contain Only Numbers',
                'string.lenth': 'OTP Must Be 6 Digits Long',
                'any.only': 'Invalid OTP. Try Again'
            }),
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).optional().allow('').messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            }),
            key: Joi.string().valid('register', 'forgot', 'change', 'tfa', 'login').required(),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To verify otp for login
    verifyOtp_login: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            }),
            otp: Joi.string().pattern(/^[0-9]+$/).length(6).required().allow('').messages({
                'string.pattern.base': 'OTP Should Contain Only Numbers',
                'string.lenth': 'OTP Must Be 6 Digits Long',
                'any.only': 'Invalid OTP. Try Again'
            }),
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).required().allow('').messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To login
    validateLogin: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            }),
            password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|\-=])/).min(8).max(25).required().messages({
                'string.pattern.base': 'Password Should Contain At Least 1 Capital Letter, 1 Small Letter, 1 Number And 1 Special Character',
            })
        })

        return schema.validate(data)
    },

    // Google auth
    vlaidateOAuth: (data) => {
        const schema = Joi.object({
            credential: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To resend otp
    validateResendOtp: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            }),
            key: Joi.string().valid('login', 'register', 'forgot', 'change', 'tfa', 'withdraw', 'settlement').required()
        })

        return schema.validate(data)
    },

    // To validate email
    validateEmail: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            })
        })

        return schema.validate(data)
    },

    // To reset password with new password
    resetPassword: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            }),
            password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|\-=])/).min(8).max(25).required().messages({
                'string.pattern.base': 'Password Should Contain At Least 1 Capital Letter, 1 Small Letter, 1 Number And 1 Special Character',
            }),
            otp: Joi.string().pattern(/^[0-9]+$/).length(6).required().allow('').messages({
                'string.pattern.base': 'OTP Should Contain Only Numbers',
                'string.lenth': 'OTP Must Be 6 Digits Long',
                'any.only': 'Invalid OTP. Try Again'
            }),
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).required().allow('').messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To verify 2fa code
    verifyTfa: (data) => {
        const schema = Joi.object({
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).required().messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To disable 2fa
    disableTfa: (data) => {
        const schema = Joi.object({
            otp: Joi.string().pattern(/^[0-9]+$/).length(6).required().messages({
                'string.pattern.base': 'OTP Should Contain Only Numbers',
                'string.lenth': 'OTP Must Be 6 Digits Long',
                'any.only': 'Invalid OTP. Try Again'
            }),
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).required().messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To change password for user
    changePassword: (data) => {
        const schema = Joi.object({
            oldPassword: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|\-=])/).min(8).max(25).required().messages({
                'string.pattern.base': 'Old Password Should Contain At Least 1 Capital Letter, 1 Small Letter, 1 Number And 1 Special Character',
            }),
            password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|\-=])/).min(8).max(25).invalid(Joi.ref('oldPassword')).required().messages({
                'string.pattern.base': 'Password Should Contain At Least 1 Capital Letter, 1 Small Letter, 1 Number And 1 Special Character',
                'any.invalid': "New Password Should Not Be Same As Your Old Password"
            }),
            otp: Joi.string().pattern(/^[0-9]+$/).length(6).required().allow('').messages({
                'string.pattern.base': 'OTP Should Contain Only Numbers',
                'string.lenth': 'OTP Must Be 6 Digits Long',
                'any.only': 'Invalid OTP. Try Again'
            }),
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).required().allow('').messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To generate app key for user
    generateAppKey: (data) => {
        const schema = Joi.object({
            appName: Joi.string().regex(/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/).min(8).max(40).required().messages({
                'string.pattern.base': "App Name Should Not Contain Special Characters"
            }),
            successUrl: Joi.string().uri({ scheme: ['https'] }).required().messages({
                'string.uri': 'Invalid Success URL'
            }),
            notifyUrl: Joi.string().uri({ scheme: ['https'] }).required().allow('').messages({
                'string.uri': 'Invalid Notify URL'
            }),
            whiteList_ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To update app key for user
    updateAppKey: (data) => {
        const schema = Joi.object({
            appKey: Joi.string().pattern(/^[A-Z0-9]+$/).min(15).max(20).required().messages({
                'string.pattern.base': "App Key Should Not Contain Special Characters",
            }),
            successUrl: Joi.string().uri({ scheme: ['https'] }).optional().messages({
                'string.uri': 'Invalid Success URL'
            }),
            notifyUrl: Joi.string().uri({ scheme: ['https'] }).optional().allow('').messages({
                'string.uri': 'Invalid Notify URL'
            }),
            whiteList_ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).optional().allow('').messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To delete app key
    deleteAppKey: (data) => {
        const schema = Joi.object({
            appKey: Joi.string().pattern(/^[A-Z0-9]+$/).min(15).max(20).required().messages({
                'string.pattern.base': "App Key Should Not Contain Special Characters",
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To validate ip and browser id
    validateIpBrowserId: (data) => {
        const schema = Joi.object({
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To validate ip
    addWhiteListIp: (data) => {
        const schema = Joi.object({
            whiteListIp: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To rise ticket for user
    riseTicket: (data) => {
        const schema = Joi.object({
            // title: Joi.string().regex(/^[a-zA-Z0-9@.]+(?: [a-zA-Z0-9@.]+)*$/).min(5).max(30).trim().required().messages({
            //     'string.pattern.base': "Title Should Not Contain Special Characters"
            // }),
            message: Joi.string().trim().regex(/^[a-zA-Z0-9@.,!?]+(?: [a-zA-Z0-9@.,!?]+)*$/).min(10).max(200).required().messages({
                'string.pattern.base': "Message Should Not Contain Special Characters"
            })
        })

        return schema.validate(data)
    },

    // To update(reply & close) ticket for admin
    updateTicket: (data) => {
        const schema = Joi.object({
            ticketId: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                'string.pattern.base': "Ticket ID Should Not Contain Any Special Characters"
            }),
            message: Joi.string().trim().regex(/^[a-zA-Z0-9@.,!?]+(?: [a-zA-Z0-9@.,!?]+)*$/).min(10).max(200).optional().allow('').messages({
                'string.pattern.base': "Message Should Not Contain Special Characters"
            }),
            status: Joi.string().valid("OPEN", "CLOSED").optional().allow(''),
        })

        return schema.validate(data)
    },


    approve_reject_withdral: (data) => {
        const schema = Joi.object({
          tid: Joi.string().min(10).max(25).required(),
          status: Joi.string().valid("SUCCESS", "FAILED").required(),
          hash: Joi.string().min(10).max(50).required(),
        });
        return schema.validate(data);
      },
    



    // To reply ticket for user
    replyTicket: (data) => {
        const schema = Joi.object({
            ticketId: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                'string.pattern.base': "Ticket ID Should Not Contain Any Special Characters"
            }),
            message: Joi.string().trim().regex(/^[a-zA-Z0-9@.,!?]+(?: [a-zA-Z0-9@.,!?]+)*$/).min(10).max(200).optional().allow('').messages({
                'string.pattern.base': "Message Should Not Contain Special Characters"
            }),
        })

        return schema.validate(data)
    },

    // To register new admin
    registerAdmin: (data) => {
        const schema = Joi.object({
            // userName: Joi.string().pattern(/^[a-z0-9]+$/).min(3).max(25).required().messages({
            //     'string.pattern.base': "Username Should Not Contain Special Characters",
            // }),
            email: Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
            }),
            password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|\-=])/).min(8).max(25).required().messages({
                'string.pattern.base': 'Password Should Contain At Least 1 Capital Letter, 1 Small Letter, 1 Number And 1 Special Character',
            }),
            adminType: Joi.string().valid('1', '2', '3').optional().allow('')
        })

        return schema.validate(data)
    },

    // To get list
    getList: (data, fullList=true) => {
        const schema = Joi.object({
            skip: fullList ? Joi.number().integer().positive().allow(0).required() : Joi.number().integer().positive().allow(0, '').optional(),
            limit: fullList ? Joi.number().integer().greater(0).required() : Joi.number().integer().greater(0).allow(0, '').optional(),
        })

        return schema.validate(data)
    },

    // To get users list
    getUsers: (data) => {
        const schema = Joi.object({
            skip: Joi.number().integer().positive().allow(0).required(),
            limit: Joi.number().integer().greater(0).required(),
            filters: Joi.object({
                search: Joi.alternatives().try(
                    Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(7).max(30).required().allow('').messages({
                        'string.pattern.base': "User ID Should Not Contain Any Special Characters"
                    }),
                    Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().allow('').messages({
                        'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
                    })
                ).allow('').messages({
                    'alternatives.match': "Invalid Id or Email"
                })
            }).required()
        })

        return schema.validate(data)
    },

    // To get transactions list
    getTransactions: (data) => {
        const schema = Joi.object({
            skip: Joi.number().integer().positive().allow(0).required(),
            limit: Joi.number().integer().greater(0).required(),
            filters: Joi.object({
                type: Joi.string().valid("withdraw", "transaction").required(),
                search: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(30).required().allow('').messages({
                    'string.pattern.base': "User ID/Transaction ID Should Not Contain Any Special Characters"
                }),
                fromDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().allow('').messages({
                    "string.pattern.base": "From Date Should Be In YYYY-MM-DD Format"
                }),
                toDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().allow('').messages({
                    "string.pattern.base": "To Date Should Be In YYYY-MM-DD Format"
                })
            }).required()
        })

        return schema.validate(data)
    },

    // To validates username or email
    validateUsernameOrEmail: (data) => {
        const schema = Joi.object({
            search: Joi.alternatives().try(
                Joi.string().pattern(/^[a-z0-9]+$/).min(3).max(25).required().messages({
                    'string.pattern.base': "Username Should Not Contain Special Characters",
                }),
                Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                    'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
                })
            ).messages({
                'alternatives.match': "Invalid Username Or Emai"
            })
        })

        return schema.validate(data)
    },

    // To validates username or email
    validateIdOrEmail: (data) => {
        const schema = Joi.object({
            search: Joi.alternatives().try(
                Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(30).required().messages({
                    'string.pattern.base': "User ID Should Not Contain Any Special Characters"
                }),
                Joi.string().email().regex(/^[a-z0-9._%+-]+@[a-z.-]+\.[a-z]{2,}$/).min(5).max(35).required().messages({
                    'string.pattern.base': 'Email Should Not Contain Special Characters And Capital Case Letters'
                })
            ).messages({
                'alternatives.match': "Invalid Id or Email"
            })
        })

        return schema.validate(data)
    },

    // To validates user id or username
    validateIdOrUsername: (data) => {
        const schema = Joi.object({
            search: Joi.alternatives().try(
                Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                    'string.pattern.base': "User ID Should Not Contain Any Special Characters"
                }),
                Joi.string().pattern(/^[a-z0-9]+$/).min(3).max(25).required().messages({
                    'string.pattern.base': "Username Should Not Contain Special Characters",
                })
            ).messages({
                'alternatives.match': "Invalid User Id Or Username"
            })
        })

        return schema.validate(data)
    },

    // To update user profile
    updateUser: (data) => {
        const schema = Joi.object({
            status: Joi.string().valid("ACTIVE", "BLOCKED").optional().allow(''),
            tfaStatus: Joi.string().valid("DISABLE").optional().allow(''),
            referralStatus: Joi.string().valid("ACTIVE", "PENDING"),
            withdrawStatus: Joi.string().valid("ENABLE", "DISABLE").optional().allow(''),
            transferStatus: Joi.string().valid("ENABLE", "DISABLE").optional().allow(''),
            depositeStatus: Joi.string().valid("ENABLE", "DISABLE").optional().allow(''),
            // merchantFee: Joi.number().greater(0).max(50).optional().allow('')
            merchantFee: Joi.object({
                type: Joi.string().valid("FLAT", "PERCENTAGE").required(),
                value: Joi.number().greater(0).required(),
            }).optional().allow(''),
        });

        return schema.validate(data)
    },

    // To update admin
    updateAdmin: (data) => {
        const schema = Joi.object({
            adminType: Joi.string().valid('1', '2', '3').optional().allow(''),
            status: Joi.string().valid("ACTIVE", "BLOCKED").optional().allow(''),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To update admin controls
    updateAdminControls: (data) => {
        const schema = Joi.object({
            login: Joi.string().valid("ENABLE", "DISABLE").required(),
            register: Joi.string().valid("ENABLE", "DISABLE").required(),
            withdraw: Joi.string().valid("ENABLE", "DISABLE").required(),
            deposit: Joi.string().valid("ENABLE", "DISABLE").required(),

            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To add coin to admin controls and user
    addCoin: (data) => {
        const schema = Joi.object({
            coinName: Joi.string().pattern(/^[a-z]+$/).min(3).max(15).required().messages({
                'string.pattern.base': "Coin Name Should Not Contain Any Special Characters"
            }),
            coinTicker: Joi.string().pattern(/^[A-Z]+$/).min(3).max(5).required().messages({
                'string.pattern.base': "Coin Ticker Should Not Contain Any Special Characters"
            }),
            coinLogo: Joi.string().required(),
            coinStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            precision: Joi.number().positive().greater(0).integer().required(),
            note: Joi.string().regex(/^[a-zA-Z0-9.,]+(?: [a-zA-Z0-9.,]+)*$/).min(5).max(255).allow("").required(),
            withdraw: Joi.object({
                withdrawMin: Joi.number().positive().required(),
                withdrawMax: Joi.number().positive().greater(Joi.ref('withdrawMin')).required(),
                withdrawFee: Joi.number().positive().required(),
                withdrawStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            }).required(),
            deposit: Joi.object({
                depositMin: Joi.number().positive().required(),
                depositMax: Joi.number().positive().greater(Joi.ref('depositMin')).required(),
                depositFee: Joi.number().positive().required(),
                depositStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            }).required(),
            settlementMin: Joi.number().greater(0).required(),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To update coin to admin controls and user
    updateCoin: (data) => {
        const schema = Joi.object({
            coinId: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                'string.pattern.base': "Coin Id Should Not Contain Any Special Characters"
            }),
            coinName: Joi.string().pattern(/^[a-z]+$/).min(3).max(15).required().messages({
                'string.pattern.base': "Coin Name Should Not Contain Any Special Characters"
            }),
            coinLogo: Joi.string().required(),
            coinTicker: Joi.string().pattern(/^[A-Z]+$/).min(3).max(5).required().messages({
                'string.pattern.base': "Coin Ticker Should Not Contain Any Special Characters"
            }),
            coinStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            note: Joi.string().regex(/^[a-zA-Z0-9.,]+(?: [a-zA-Z0-9.,]+)*$/).min(5).max(255).allow("").required(),
            precision: Joi.number().positive().greater(0).integer().required(),
            withdraw: Joi.object({
                withdrawMin: Joi.number().min(0).required(),
                withdrawMax: Joi.number().min(Joi.ref('withdrawMin')).required(),
                withdrawFee: Joi.number().min(0).required(),
                withdrawStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            }).required(),
            deposit: Joi.object({
                depositMin: Joi.number().min(0).required(),
                depositMax: Joi.number().min(Joi.ref('depositMin')).required(),
                depositFee: Joi.number().min(0).required(),
                depositStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            }).required(),
            settlementMin: Joi.number().greater(0).required(),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To add/update chain
    addUpdateChain: (data) => {
        const schema = Joi.object({
            coin: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                'string.pattern.base': "Coin Id Should Not Contain Any Special Characters"
            }),
            chainId: Joi.string().pattern(/^[A-Z0-9]+$/).min(3).max(20).required().messages({
                'string.pattern.base': "Chain Id Should Not Contain Any Special Characters"
            }),
            chainName: Joi.string().regex(/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/).min(3).max(25).required().messages({
                'string.pattern.base': "Chain Name Should Not Contain Special Characters",
                'string.min': "Chain Name Length Should Be Minimum 3 Characters",
                'string.max': "Chain Name Length Should Be Maximum 25 Characters",
            }),
            contractAddress : Joi.string().required(),
            chainLogo: Joi.string().required(),
            fee: Joi.number().min(0).required().required(),
            min: Joi.number().min(0).required(),
            max: Joi.number().min(Joi.ref('min')).required(),
            chainStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            note: Joi.string().regex(/^[a-zA-Z0-9.,]+(?: [a-zA-Z0-9.,]+)*$/).min(5).max(255).required().allow(""),
        })

        return schema.validate(data)
    },

    // To delete chain
    deleteChain: (data) => {
        const schema = Joi.object({
            coin: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                'string.pattern.base': "Coin Id Should Not Contain Any Special Characters"
            }),
            chain: Joi.string().pattern(/^[A-Z0-9]+$/).min(3).max(20).required().messages({
                'string.pattern.base': "Chain Id Should Not Contain Any Special Characters"
            })
        })

        return schema.validate(data)
    },

    // To udpate settlement type
    updateSettlement: (data) => {
        const schema = Joi.object({
            coin: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                'string.pattern.base': "Coin Id Should Not Contain Any Special Characters"
            }),
            settlementType: Joi.string().valid("MONTHLY", "AMOUNT").required().messages({
                'any.only': "Settlement Type Must Be 'Monthly' or 'Amount'"
            }),
            settlementIn: Joi.when('settlementType', {
                is: 'AMOUNT',
                then: Joi.number().integer().greater(0).required(),
                otherwise: Joi.number().valid(1).required().messages({
                    'any.only': "Settlement In Must Be Equal To '1'"
                })
            }),
            address: Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(15).max(55).required(),
            settlementStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            otp: Joi.string().pattern(/^[0-9]+$/).length(6).required().messages({
                'string.pattern.base': 'OTP Should Contain Only Numbers',
                'string.lenth': 'OTP Must Be 6 Digits Long',
                'any.only': 'Invalid OTP. Try Again'
            }),
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).optional().allow('').messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            }),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To validate id --> user id/coin id/transaction id
    validteId: (data) => {
        const schema = Joi.object({
            id: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(20).required().messages({
                'string.pattern.base': "Id Should Not Contain Any Special Characters"
            })
        })
        
        return schema.validate(data)
    },
    
    // To update referral in admin controls
    updateReferral: (data) => {
        const schema = Joi.object({
            referralStatus: Joi.string().valid("ENABLE", "DISABLE").required(),
            referralPercentage: Joi.number().positive().greater(0).max(10),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })
        
        return schema.validate(data)
    },
    
    // To validate id
    validateId: (data) => {
        const schema = Joi.object({
            id: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(30).required().messages({
                'string.pattern.base': "ID Should Not Contain Any Special Characters"
            })
        })

        return schema.validate(data)
    },
    
    // To validate token
    validateGoogleAuth: (data) => {
        const schema = Joi.object({
            accessToken: Joi.string().required(),
            ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({
                'string.ip': "Invalid Ip Address Format"
            }),
            browserId: Joi.string().required()
        })

        return schema.validate(data)
    },

    // To initiate withdraw
    initiateWithdraw: (data) => {
        const schema = Joi.object({
            coin: Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(7).max(15).required().messages({
                'string.pattern.base': "Coin ID Should Not Contain Any Special Characters"
            }),
            amount: Joi.number().greater(0).required(),
            address: Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(25).max(50).required().messages({
                'string.pattern.base': "Address Should Not Contain Any Special Characters"
            }),
            chain: Joi.string().pattern(/^[A-Z0-9]+$/).min(3).max(20).required().messages({
                'string.pattern.base': "Chain ID Should Not Contain Any Special Characters"
            })
        })

        return schema.validate(data)
    },

    // To withdraw balance
    withdrawBalance: (data) => {
        const schema = Joi.object({
            tId: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(30).required().messages({
                'string.pattern.base': "Transaction ID Should Not Contain Any Special Characters"
            }),
            otp: Joi.string().pattern(/^[0-9]+$/).length(6).required().messages({
                'string.pattern.base': 'OTP Should Contain Only Numbers',
                'string.lenth': 'OTP Must Be 6 Digits Long',
                'any.only': 'Invalid OTP. Try Again'
            }),
            tfaCode: Joi.string().pattern(/^[0-9]+$/).length(6).optional().allow('').messages({
                'string.pattern.base': "2FA Code Should Contain Only Numbers"
            })
        })

        return schema.validate(data)
    },

    // To generate hash
    generateHash: (data) => {
        const schema = Joi.object({
            invNo: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(30).required().messages({
                'string.pattern.base': "Invoice Number Should Not Contain Any Special Characters"
            }),
            amount: Joi.number().greater(0).required(),
            coin: Joi.string().pattern(/^[A-Z0-9]+$/).min(7).max(15).required().messages({
                'string.pattern.base': "Coin Id Should Not Contain Any Special Characters"
            }),
            chain: Joi.string().pattern(/^[A-Z0-9]+$/).min(3).max(15).required().messages({
                'string.pattern.base': "Chain Id Should Not Contain Any Special Characters"
            }),
        })

        return schema.validate(data)
    },

    // To validate hash
    validateHash: (data) => {
        const schema = Joi.object({
            hash: Joi.string().required()
        })

        return schema.validate(data)
    }
}
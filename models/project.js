const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const issueSchema = new Schema(
    {
        project: {
            type: String
        },
        issue_title: {
            type: String,
            required: true,
        },
        issue_text: {
            type: String,
            required: true,
        },
        created_by: {
            type: String,
            required: true
        },
        assigned_to: {
            //optional
            type: String,
            default: ''
        },
        status_text: {
            //optional
            type: String,
            default: ''
        },
        created_on: {
            type: String,
        },
        updated_on: {
            type: String
        },
        open: {
            //must be true by default
            type: Boolean,
            default: true
        }
    }
);

//middleware for mongoose that will create or update Date properties
issueSchema.pre('save', function (next) {
    if (!this.created_on) {
        //it is much more useful to save Date as string
        this.created_on = new Date().toISOString();
    }
    this.updated_on = new Date().toISOString();
    next();
})





const projectSchema = new mongoose.Schema(
    {
        projectname: {
            type: String,
            required: true,
        },
        created_on: {
            type: Date,
        }
    }
);

projectSchema.pre('save', function (next) {
    if (!this.created_on) {
        this.created_on = new Date().toISOString();
    }
    next();
})


const Issue = mongoose.model('Issue', issueSchema)
const Project = mongoose.model('Project', projectSchema);


const initialProject = new Project({
    _id: new mongoose.Types.ObjectId(),
    projectname: 'apitest'
});

initialProject.save(function (err) {
    if (err) return handleError(err);

});




module.exports = { Project, Issue };
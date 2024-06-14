'use strict';
const { Project } = require('../models/project');
const { Issue } = require('../models/project');
const { inspect } = require('util');
const mongoose = require('mongoose');

//gets req.query as first argument, then possible queries as second argument.
//looks if req.query has all the possible fields then returns an object with each params
//destructured
const queryOrBodyParser = (source, fields, obj = {}) => {
  fields.forEach(field => {
    if (source[field]) {
      obj[field] = source[field]
    }
  })
  return obj;
}

//compares all the string elements inside requiredFields to each element in issue object,
//if it finds a match pushes it to the errors array

function requiredFieldChecker(issue, requiredFields) {
  let errors = []


  requiredFields.forEach(field => {
    if (!issue[field]) { errors.push(field) }
  })

  if (errors.length) {
    return { error: 'required field(s) missing' }
  }
  // return false
}
module.exports = function (app) {
  app.route('/api/issues/:project')

    .get(async (req, res) => {
      let fields = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open', 'created_on', 'updated_on'];
      let query = queryOrBodyParser(req.query, fields);
      //we do query.project so we can also query mongoose against project name
      query.project = req.params.project;
      //You can send a GET request to /api/issues/{projectname}
      //for an array of all issues for that specific projectname,
      // with all the fields present for each issue.

      if (req.query._id) {
        query._id = mongoose.Types.ObjectId(req.query._id);
      }

      await Issue.find(query, (err, issues) => {
        if (err) {
          res.status(400).send(err)
        }
        res.json(issues)
      })

      //You can send a GET request to /api/issues/{projectname} 
      //and filter the request by also passing along
      // any field and value as a URL query (ie. /api/issues/{project}?open=false).
      // You can pass one or more field/value pairs at once
    })

    .post(async (req, res) => {
      let project = req.params.project;
      req.body.project = project;
      let errors = requiredFieldChecker(req.body, ['project', 'issue_title', 'issue_text', 'created_by'])
      if (errors) {
        //even though errors object returns the correct message, it is nested so I am manually typing it in

        return res.send({ error: 'required field(s) missing' });
        // res.error = 'required field(s) missing';

      } else {
        let fields = ['project', 'issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text']
        let issue = new Issue(queryOrBodyParser(req.body, fields))

        await issue.save(function (err) {
          if (err) return console.log(err);
        });

        res.status(200).send(issue);
      }


    })

    .put(async (req, res) => {
      let project = req.params.project;
      let fields = ['_id', 'issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text'];
      let fieldsToUpdate = queryOrBodyParser(req.body, fields);

      if (Object.keys(fieldsToUpdate).length < 2) {
        if (!req.body._id) {
          return res.send({ error: 'missing _id' })
        }
        return res.send({ error: 'no update field(s) sent', _id: fieldsToUpdate._id })
      }

      let issue = await Issue.findOne({ _id: fieldsToUpdate._id }).exec();

      if (!issue) {
        return res.send({ error: 'could not update', _id: fieldsToUpdate._id });
      }

      delete fieldsToUpdate._id;
      Object.keys(fieldsToUpdate).forEach(key => {
        issue[key] = fieldsToUpdate[key];
        issue.markModified('key');
      })
      issue.updated_on = Date();

      issue.save(function (err) {
        if (err) return handleError(err);
      });

      res.json({ result: 'successfully updated', _id: issue._id })
    })

    .delete(async (req, res) => {
      let project = req.params.project;
      let _id = req.body._id;
      if (!_id) {
        return res.send({ error: 'missing _id' });
      }
      let issue = await Issue.findOne({ _id: _id }).exec();
      console.log(issue);
      if (!issue) {
        return res.send({ error: 'could not delete', _id: _id })
      } else {
        Issue.findByIdAndRemove({ _id });
        res.status(200).json({ result: 'successfully deleted', _id: issue._id })
      }


      //You can send a DELETE request to /api/issues/{projectname}
      //with an _id to delete an issue.
      //If no _id is sent, the return value is { error: 'missing _id' }.
      // On success, the return value is { result: 'successfully deleted', '_id': _id }.
      // On failure, the return value is { error: 'could not delete', '_id': _id }.
    });


};

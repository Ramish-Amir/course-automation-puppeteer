const { openPageAndGetHref } = require("./index");

async function runQuizAgent() {
  const { href, page, browser } = await openPageAndGetHref();
  try {
    console.log("HREF >>> ", href);
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    await browser.close();
  }
}

// runQuizAgent();

// <div role="region" aria-label="Question" class="quiz_sortable question_holder " id="" style="" data-group-id="">
//   <div style="display: block; height: 1px; overflow: hidden;">&nbsp;</div>
//   <a name="question_254037"></a>
//   <div class="display_question question multiple_choice_question" id="question_254037">

// <div class="move">
//   <a tabindex="0" class="draggable-handle" role="button">
//     <i class="icon-drag-handle">
//       <span class="screenreader-only">Move To...</span>
//       <span class="accessibility-warning screenreader-only">
//         This element is a more accessible alternative to drag &amp; drop reordering. Press Enter or Space to move this question.
//       </span>
//     </i>
//   </a>
// </div>

//       <a href="#" class="flag_question" role="checkbox" aria-checked="false">
//         <span class="screenreader-only">
//           Flag question: Question 1
//         </span>
//       </a>
//     <div class="header">
//       <span class="name question_name" role="heading" aria-level="2">Question 1</span>
//       <span class="question_points_holder" style="">
//         <span class="points question_points">1</span> pts
//     </span>
//     </div>
//       <div class="links" style="display: none;">
//         <a href="#" class="edit_question_link no-hover" title="Edit this Question"><i class="icon-edit standalone-icon"><span class="screenreader-only">Edit this Question</span></i></a>
//           <a href="#" class="delete_question_link no-hover" title="Delete this Question"><i class="icon-end standalone-icon"><span class="screenreader-only">Delete this Question</span></i></a>
//       </div>
//     <div style="display: none;">
//       <span class="regrade_option"></span>
//       <span class="regrade_disabled">0</span>
//       <span class="question_type">multiple_choice_question</span>
//       <span class="answer_selection_type"></span>
//         <a href="/courses/3161/quizzes/12182/questions/254037" class="update_question_url">&nbsp;</a>
//       <span class="assessment_question_id">646031</span>
//     </div>
//     <div class="text">
//       <div class="original_question_text" style="display: none;">
//         <textarea disabled="" style="display: none;" name="text_after_answers" class="textarea_text_after_answers"></textarea>
//         <textarea disabled="" style="display: none;" name="question_text" class="textarea_question_text">What is the function of the power supply?</textarea>
//       </div>
//       <div id="question_254037_question_text" class="question_text user_content enhanced">
//           What is the function of the power supply?
//       </div>
//       <div class="answers">
//               <fieldset>
//                 <legend class="screenreader-only">
//                   Group of answer choices
//                 </legend>

// <div class="answer">
//     <label class="answer_row user_content enhanced">
//       <span class="answer_input">
//           <input type="radio" class="question_input" name="question_254037" value="33613" id="question_254037_answer_33613" aria-labelledby="question_254037_answer_33613_label" aria-label="">
//       </span>
//       <div class="answer_label" id="question_254037_answer_33613_label">
//         To filter the voltage to decrease it going into the PC
//       </div>
//     </label>
// </div>

// <div class="answer">
//     <label class="answer_row user_content enhanced">
//       <span class="answer_input">
//           <input type="radio" class="question_input" name="question_254037" value="54532" id="question_254037_answer_54532" aria-labelledby="question_254037_answer_54532_label" aria-label="">
//       </span>
//       <div class="answer_label" id="question_254037_answer_54532_label">
//         To filter the voltage to North American electrical standards
//       </div>
//     </label>
// </div>

// <div class="answer">
//     <label class="answer_row user_content enhanced">
//       <span class="answer_input">
//           <input type="radio" class="question_input" name="question_254037" value="92168" id="question_254037_answer_92168" aria-labelledby="question_254037_answer_92168_label" aria-label="">
//       </span>
//       <div class="answer_label" id="question_254037_answer_92168_label">
//         To filter the voltage to increase it going into the PC
//       </div>
//     </label>
// </div>

// <div class="answer">
//     <label class="answer_row user_content enhanced">
//       <span class="answer_input">
//           <input type="radio" class="question_input" name="question_254037" value="54959" id="question_254037_answer_54959" aria-labelledby="question_254037_answer_54959_label" aria-label="">
//       </span>
//       <div class="answer_label" id="question_254037_answer_54959_label">
//         To filter the voltage to charge the batteries
//       </div>
//     </label>
// </div>

//               </fieldset>
//       </div>
//       <div class="after_answers">
//       </div>
//     </div>
//     <div class="clear"></div>
//   </div>
// </div>

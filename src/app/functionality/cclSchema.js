/**
 * Default Draft CCL merge field schema.
 * Each key corresponds to a token in the Word template.
 */
const schema = {
    insert_clients_name: '',
    insert_heading_eg_matter_description: '',
    matter: '',
    name_of_person_handling_matter: '',
    status: '',
    names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries: '',
    identify_the_other_party_eg_your_opponents: '',
    email: '',
    insert_current_position_and_scope_of_retainer: '',
    next_steps: '',
    realistic_timescale: '',
    estimate: '',
    figure: '',
    next_stage: '',
    we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible: ''
};

const tokens = Object.keys(schema);

module.exports = { schema, tokens };
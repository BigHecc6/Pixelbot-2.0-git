module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        this.userCount = newState.members;
        
    },
};